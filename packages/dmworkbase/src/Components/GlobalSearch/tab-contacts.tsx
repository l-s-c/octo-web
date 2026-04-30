import React, { Component } from "react";
import { ReactNode } from "react";
import ItemContacts from "./item-contacts";
import WKApp from "../../App";
import { isBot } from "../WKAvatar";
import BotDetailModal from "../BotDetailModal";
import WKSDK, { Channel, ChannelInfo, ChannelInfoListener, ChannelTypePerson } from "wukongimjssdk";
import { resolveExternalForViewer } from "../../Utils/externalViewer";
import "./tab-contacts.css"

interface TabContactsProps {
    keyword?: string;
    friends?: any[];
    onClick?: (item: any) => void;
}

interface TabContactsState {
    botDetailUid: string;
    botDetailVisible: boolean;
}

export default class TabContacts extends Component<TabContactsProps, TabContactsState> {
    state: TabContactsState = {
        botDetailUid: "",
        botDetailVisible: false,
    };

    // YUJ-138 follow-up: channelInfo 到达后强制重渲，否则 resolveSourceSpaceName
    // 走 fetchChannelInfo 异步分支时，首次渲染的 sourceSpaceName=""，UI 永远不更新。
    private _channelInfoListener!: ChannelInfoListener

    componentDidMount() {
        this._channelInfoListener = (channelInfo: ChannelInfo) => {
            if (channelInfo?.channel?.channelType === ChannelTypePerson) {
                this.forceUpdate()
            }
        }
        WKSDK.shared().channelManager.addListener(this._channelInfoListener)
    }

    componentWillUnmount() {
        if (this._channelInfoListener) {
            WKSDK.shared().channelManager.removeListener(this._channelInfoListener)
        }
    }

    /**
     * YUJ-138: 判定搜索到的联系人相对当前查看 Space 是否为外部成员，返回要
     * 展示在姓名后的「@{sourceSpaceName}」文本。优先读 friend 项自身带的
     * home_space_id / home_space_name / is_external / source_space_name 字段；
     * 缺失时回落到 channelInfo.orgData，同 @Mention 候选、成员列表保持一致。
     * 返回空字符串表示同 Space / 非外部 / 信息不足，上层不渲染后缀。
     */
    private resolveSourceSpaceName(friend: any): string {
        const org = friend?.orgData ?? {}
        let homeId: string | undefined = friend?.home_space_id ?? org.home_space_id
        let homeName: string | undefined = friend?.home_space_name ?? org.home_space_name
        let isExternalLegacy: number | undefined = friend?.is_external ?? org.is_external
        let sourceNameLegacy: string | undefined =
            friend?.source_space_name ?? org.source_space_name

        // 回落：friend 顶层与 orgData 都没有外部字段时，从已缓存的 channelInfo 取
        const missingHome = !homeId
        const missingLegacy =
            isExternalLegacy === undefined || isExternalLegacy === null
        if (missingHome && missingLegacy && friend?.channel_id) {
            const ch = new Channel(friend.channel_id, ChannelTypePerson)
            const ci = WKSDK.shared().channelManager.getChannelInfo(ch)
            const ciOrg = ci?.orgData
            if (ciOrg) {
                // homeId / isExternalLegacy 此时由 missingHome / missingLegacy 判据保证
                // 必然 falsy 或 undefined，直接赋值即可；homeName / sourceNameLegacy
                // 可能已从 friend 顶层或 orgData 取到，保留 ?? 兜底。
                homeId = ciOrg.home_space_id as string | undefined
                homeName = homeName ?? (ciOrg.home_space_name as string | undefined)
                isExternalLegacy = ciOrg.is_external as number | undefined
                sourceNameLegacy =
                    sourceNameLegacy ??
                    (ciOrg.source_space_name as string | undefined)
            } else {
                // 异步拉一次，channelInfo 返回后 componentDidMount 的 listener 会 forceUpdate
                WKSDK.shared().channelManager.fetchChannelInfo(ch)
            }
        }

        const { isExternal, sourceSpaceName } = resolveExternalForViewer({
            homeSpaceId: homeId,
            homeSpaceName: homeName,
            isExternalLegacy,
            sourceSpaceNameLegacy: sourceNameLegacy,
        })
        return isExternal ? sourceSpaceName : ""
    }

    render(): ReactNode {
        return <div className="wk-tab-contacts">
            {
                this.props.friends?.map((item: any) => {
                    // YUJ-138 follow-up: 用 local displayName 替代对 item.channel_name 的 mutation。
                    // 之前直接改 item.channel_name（props / 源数据）会在 listener 触发 re-render
                    // 后累积成 <mark><mark>key</mark></mark>（double-wrap），sanitizeHighlight
                    // 虽然 escape 但视觉退化。保留源数据干净，仅渲染时替换。
                    let displayName: string = item.channel_name
                    if (this.props.keyword && item.channel_name.indexOf(this.props.keyword) !== -1) {
                        displayName = item.channel_name.replace(
                            this.props.keyword,
                            `<mark>${this.props.keyword}</mark>`
                        )
                    }
                    // YUJ-138: 跨 Space 搜索联系人时展示来源 Space，避免误选外部成员
                    const sourceSpaceName = this.resolveSourceSpaceName(item)
                    return <ItemContacts
                    key={item.channel_id}
                    name={displayName}
                    avatar={WKApp.shared.avatarUser(item.channel_id)}
                    isBot={isBot(item.channel_id)}
                    sourceSpaceName={sourceSpaceName}
                    onClick={()=>{
                        // #106: Bot 搜索结果点击弹名片
                        if (isBot(item.channel_id)) {
                            this.setState({ botDetailUid: item.channel_id, botDetailVisible: true });
                            return;
                        }
                        if(this.props.onClick) {
                            this.props.onClick(item)
                        }
                    }}
                    />
                })
            }
            <BotDetailModal
                uid={this.state.botDetailUid}
                visible={this.state.botDetailVisible}
                onClose={() => this.setState({ botDetailVisible: false })}
                onChat={(channel) => {
                    WKApp.endpoints.showConversation(channel);
                    this.setState({ botDetailVisible: false });
                }}
            />
        </div>
    }
}
