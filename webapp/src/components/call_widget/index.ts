import {bindActionCreators, Dispatch} from 'redux';
import {connect} from 'react-redux';
import {GlobalState} from '@mattermost/types/store';
import {UserProfile} from '@mattermost/types/users';
import {IDMappedObjects} from '@mattermost/types/utilities';

import {getUsers} from 'mattermost-redux/selectors/entities/common';
import {getChannel} from 'mattermost-redux/selectors/entities/channels';
import {getCurrentUserId} from 'mattermost-redux/selectors/entities/users';
import {getTeam, getCurrentTeamId} from 'mattermost-redux/selectors/entities/teams';

import {Client4} from 'mattermost-redux/client';

import {UserState} from '../../types/types';

import {showExpandedView, showScreenSourceModal} from '../../actions';

import {connectedChannelID, voiceConnectedProfiles, voiceUsersStatuses, voiceChannelCallStartAt, voiceChannelScreenSharingID, expandedView, voiceChannelRootPost} from '../../selectors';

import {getChannelURL, alphaSortProfiles, stateSortProfiles} from '../../utils';

import CallWidget from './component';

const mapStateToProps = (state: GlobalState) => {
    const channel = getChannel(state, connectedChannelID(state));

    const screenSharingID = voiceChannelScreenSharingID(state, channel?.id) || '';

    const sortedProfiles = (profiles: UserProfile[], statuses: {[key: string]: UserState}) => {
        return [...profiles].sort(alphaSortProfiles(profiles)).sort(stateSortProfiles(profiles, statuses, screenSharingID));
    };

    const statuses = voiceUsersStatuses(state);
    const profiles = sortedProfiles(voiceConnectedProfiles(state), statuses);

    const profilesMap: IDMappedObjects<UserProfile> = {};
    const picturesMap: {
        [key: string]: string,
    } = {};
    for (let i = 0; i < profiles.length; i++) {
        const pic = Client4.getProfilePictureUrl(profiles[i].id, profiles[i].last_picture_update);
        picturesMap[profiles[i].id] = pic;
        profilesMap[profiles[i].id] = profiles[i];
    }

    let channelURL = '';
    let postId = '';
    if (channel) {
        channelURL = getChannelURL(state, channel, channel.team_id);
        postId = voiceChannelRootPost(state, channel.id);
    }

    return {
        currentUserID: getCurrentUserId(state),
        channel,
        team: getTeam(state, getCurrentTeamId(state)),
        channelURL,
        profiles,
        profilesMap,
        picturesMap,
        statuses: voiceUsersStatuses(state) || {},
        callStartAt: voiceChannelCallStartAt(state, channel?.id) || 0,
        screenSharingID,
        show: !expandedView(state),
        integrations: (state as any).plugins.components.CallsDropdownMenu,
        postId,
    };
};

const mapDispatchToProps = (dispatch: Dispatch) => bindActionCreators({
    showExpandedView,
    showScreenSourceModal,
}, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(CallWidget);

