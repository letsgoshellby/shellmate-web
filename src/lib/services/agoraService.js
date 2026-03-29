import AgoraRTC from 'agora-rtc-sdk-ng';

/**
 * Agora Video Call Service
 * Agora SDK를 관리하고 비디오 통화 기능을 제공하는 서비스
 */
class AgoraService {
  constructor() {
    this.client = null;
    this.localAudioTrack = null;
    this.localVideoTrack = null;
    this.screenTrack = null;
    this.remoteUsers = {};
    this.isJoined = false;
    this.isScreenSharing = false;
  }

  /**
   * Agora 클라이언트 초기화 및 채널 입장
   * @param {string} appId - Agora App ID
   * @param {string} channel - 채널 이름
   * @param {string} token - Agora 토큰
   * @param {number} uid - 사용자 ID (optional)
   */
  async joinChannel(appId, channel, token, uid = null) {
    try {
      // Agora 클라이언트 생성
      this.client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

      // 원격 사용자 입장 이벤트
      this.client.on('user-published', async (user, mediaType) => {
        await this.client.subscribe(user, mediaType);

        // 원격 사용자 정보 업데이트
        this.remoteUsers[user.uid] = user;

        // 화면공유 트랙인지 확인 (비디오 트랙이지만 화면공유일 수 있음)
        if (mediaType === 'video' && user.videoTrack) {
          const trackLabel = user.videoTrack.getMediaStreamTrack()?.label || '';
          const isScreenShare = trackLabel.includes('screen') || trackLabel.includes('window');
        }

        if (this.onRemoteUserJoined) {
          this.onRemoteUserJoined(user, mediaType);
        }
      });

      // 원격 사용자 퇴장 이벤트
      this.client.on('user-unpublished', (user, mediaType) => {

        if (this.onRemoteUserLeft) {
          this.onRemoteUserLeft(user, mediaType);
        }
      });

      // 원격 사용자 완전 퇴장 이벤트
      this.client.on('user-left', (user, reason) => {
        delete this.remoteUsers[user.uid];

        if (this.onRemoteUserLeft) {
          this.onRemoteUserLeft(user, 'left');
        }
      });

      // 채널 입장
      await this.client.join(appId, channel, token, uid);
      this.isJoined = true;

      // 로컬 오디오/비디오 트랙 생성 및 발행
      await this.createLocalTracks();
      await this.client.publish([this.localAudioTrack, this.localVideoTrack]);

      return true;
    } catch (error) {
      console.error('🔴 [AgoraService] 채널 입장 실패:', error);
      throw error;
    }
  }

  /**
   * 로컬 오디오/비디오 트랙 생성
   */
  async createLocalTracks() {
    try {
      [this.localAudioTrack, this.localVideoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
    } catch (error) {
      console.error('🔴 [AgoraService] 로컬 트랙 생성 실패:', error);
      throw error;
    }
  }

  /**
   * 로컬 비디오를 HTML 요소에 재생
   * @param {HTMLElement} element - 비디오를 재생할 HTML 요소
   */
  playLocalVideo(element) {
    if (this.localVideoTrack && element) {
      this.localVideoTrack.play(element);
      console.log('✅ [AgoraService] 로컬 비디오 재생');
    }
  }

  /**
   * 원격 비디오를 HTML 요소에 재생
   * @param {number} uid - 원격 사용자 UID
   * @param {HTMLElement} element - 비디오를 재생할 HTML 요소
   * @param {string} mediaType - 'video' 또는 'audio'
   */
  playRemoteVideo(uid, element, mediaType = 'video') {
    const remoteUser = this.remoteUsers[uid];
    if (remoteUser && element) {
      if (mediaType === 'video' && remoteUser.videoTrack) {
        remoteUser.videoTrack.play(element);
        console.log('✅ [AgoraService] 원격 비디오 재생:', uid);
      } else if (mediaType === 'audio' && remoteUser.audioTrack) {
        remoteUser.audioTrack.play();
        console.log('✅ [AgoraService] 원격 오디오 재생:', uid);
      }
    }
  }

  /**
   * 마이크 켜기/끄기 토글
   * @returns {boolean} 현재 마이크 상태 (true: 켜짐, false: 꺼짐)
   */
  async toggleMic() {
    if (this.localAudioTrack) {
      const enabled = this.localAudioTrack.enabled;
      await this.localAudioTrack.setEnabled(!enabled);
      console.log(`🎤 [AgoraService] 마이크: ${!enabled ? '켜짐' : '꺼짐'}`);
      return !enabled;
    }
    return false;
  }

  /**
   * 마이크 상태 설정
   * @param {boolean} enabled - true: 켜기, false: 끄기
   */
  async setMicEnabled(enabled) {
    if (this.localAudioTrack) {
      await this.localAudioTrack.setEnabled(enabled);
      console.log(`🎤 [AgoraService] 마이크: ${enabled ? '켜짐' : '꺼짐'}`);
    }
  }

  /**
   * 카메라 켜기/끄기 토글
   * @returns {boolean} 현재 카메라 상태 (true: 켜짐, false: 꺼짐)
   */
  async toggleCamera() {
    if (this.localVideoTrack) {
      const enabled = this.localVideoTrack.enabled;
      await this.localVideoTrack.setEnabled(!enabled);
      console.log(`📹 [AgoraService] 카메라: ${!enabled ? '켜짐' : '꺼짐'}`);
      return !enabled;
    }
    return false;
  }

  /**
   * 카메라 상태 설정
   * @param {boolean} enabled - true: 켜기, false: 끄기
   */
  async setCameraEnabled(enabled) {
    if (this.localVideoTrack) {
      await this.localVideoTrack.setEnabled(enabled);
      console.log(`📹 [AgoraService] 카메라: ${enabled ? '켜짐' : '꺼짐'}`);
    }
  }

  /**
   * 카메라 전환 (전면/후면)
   */
  async switchCamera() {
    if (this.localVideoTrack) {
      const devices = await AgoraRTC.getCameras();
      if (devices.length > 1) {
        const currentDevice = this.localVideoTrack.getMediaStreamTrack().getSettings().deviceId;
        const nextDevice = devices.find(d => d.deviceId !== currentDevice);
        if (nextDevice) {
          await this.localVideoTrack.setDevice(nextDevice.deviceId);
          console.log('📷 [AgoraService] 카메라 전환:', nextDevice.label);
        }
      }
    }
  }

  /**
   * 스피커 볼륨 설정
   * @param {number} volume - 볼륨 (0-100)
   */
  setVolume(volume) {
    Object.values(this.remoteUsers).forEach(user => {
      if (user.audioTrack) {
        user.audioTrack.setVolume(volume);
      }
    });
    console.log(`🔊 [AgoraService] 볼륨: ${volume}`);
  }

  /**
   * 원격 사용자 목록 가져오기
   * @returns {Object} 원격 사용자 객체
   */
  getRemoteUsers() {
    return this.remoteUsers;
  }

  /**
   * 첫 번째 원격 사용자 UID 가져오기
   * @returns {number|null} 원격 사용자 UID
   */
  getFirstRemoteUid() {
    const uids = Object.keys(this.remoteUsers);
    return uids.length > 0 ? parseInt(uids[0]) : null;
  }

  /**
   * 원격 사용자의 비디오 트랙 상태 확인
   * @param {number} uid - 원격 사용자 UID
   * @returns {boolean} 비디오 트랙 활성화 여부
   */
  isRemoteVideoEnabled(uid) {
    const user = this.remoteUsers[uid];
    return user && user.videoTrack && user.hasVideo;
  }

  /**
   * 채널에서 나가고 모든 리소스 정리
   */
  async leaveChannel() {
    try {
      // 로컬 트랙 정지 및 닫기
      if (this.localAudioTrack) {
        this.localAudioTrack.stop();
        this.localAudioTrack.close();
        this.localAudioTrack = null;
      }

      if (this.localVideoTrack) {
        this.localVideoTrack.stop();
        this.localVideoTrack.close();
        this.localVideoTrack = null;
      }

      // 채널에서 나가기
      if (this.client && this.isJoined) {
        await this.client.leave();
        this.isJoined = false;
        console.log('✅ [AgoraService] 채널 퇴장 완료');
      }

      // 리소스 정리
      this.client = null;
      this.remoteUsers = {};
    } catch (error) {
      console.error('🔴 [AgoraService] 채널 퇴장 실패:', error);
      throw error;
    }
  }

  /**
   * 원격 사용자 입장 콜백 등록
   * @param {Function} callback - (user, mediaType) => void
   */
  setOnRemoteUserJoined(callback) {
    this.onRemoteUserJoined = callback;
  }

  /**
   * 원격 사용자 퇴장 콜백 등록
   * @param {Function} callback - (user, mediaType) => void
   */
  setOnRemoteUserLeft(callback) {
    this.onRemoteUserLeft = callback;
  }

  /**
   * 화면 공유 시작
   * @returns {boolean} 화면 공유 시작 성공 여부
   */
  async startScreenShare() {
    try {
      // 화면 공유 트랙 생성
      this.screenTrack = await AgoraRTC.createScreenVideoTrack({}, 'auto');
      console.log('✅ [AgoraService] 화면 공유 트랙 생성 완료');

      // 기존 비디오 트랙 언퍼블리시
      if (this.localVideoTrack) {
        await this.client.unpublish([this.localVideoTrack]);
      }

      // 화면 공유 트랙 퍼블리시
      await this.client.publish(this.screenTrack);
      this.isScreenSharing = true;
      console.log('✅ [AgoraService] 화면 공유 시작');

      // 화면 공유 종료 이벤트 (사용자가 브라우저에서 중지 버튼을 누른 경우)
      this.screenTrack.on('track-ended', () => {
        console.log('🔴 [AgoraService] 화면 공유가 종료되었습니다');
        this.stopScreenShare();
      });

      return true;
    } catch (error) {
      console.error('🔴 [AgoraService] 화면 공유 시작 실패:', error);
      this.isScreenSharing = false;
      throw error;
    }
  }

  /**
   * 화면 공유 중지
   * @returns {boolean} 화면 공유 중지 성공 여부
   */
  async stopScreenShare() {
    try {
      if (this.screenTrack) {
        // 화면 공유 트랙 언퍼블리시
        await this.client.unpublish(this.screenTrack);

        // 화면 공유 트랙 닫기
        this.screenTrack.close();
        this.screenTrack = null;
      }

      // 기존 비디오 트랙 다시 퍼블리시
      if (this.localVideoTrack) {
        await this.client.publish([this.localVideoTrack]);
      }

      this.isScreenSharing = false;
      console.log('✅ [AgoraService] 화면 공유 중지');
      return true;
    } catch (error) {
      console.error('🔴 [AgoraService] 화면 공유 중지 실패:', error);
      throw error;
    }
  }

  /**
   * 화면 공유 토글
   * @returns {boolean} 현재 화면 공유 상태 (true: 공유 중, false: 중지)
   */
  async toggleScreenShare() {
    if (this.isScreenSharing) {
      await this.stopScreenShare();
      return false;
    } else {
      await this.startScreenShare();
      return true;
    }
  }

  /**
   * 화면 공유 상태 확인
   * @returns {boolean} 화면 공유 중 여부
   */
  isScreenSharingActive() {
    return this.isScreenSharing;
  }
}

export default AgoraService;
