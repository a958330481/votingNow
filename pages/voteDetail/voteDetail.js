const util = require('../../utils/util.js')
Page({
    data: {
        voteTitle: '',
        voteContent: '',
        voteImgs: '',
        voteOptions: '',
        voterCount: 0,
        votedColor: ['#9dc8c8', '#58c9b9', '#519d9e', '#d1b6e1'],
        createTime: '',
        voteResult: [],
        voterDetails: '',
        voteTitle: '',
        voteId: '',
        shareFrom: '',
        nickname: ''
    },
    onLoad: function(option) {
        let self = this;
        let authorization = wx.getStorageSync('authorization');
        let voteId, shareFrom, nickname;
        if (option) {
            voteId = option.voteId
            shareFrom = option.shareFrom
            nickname = option.nickname
        } else {
            voteId = self.data.voteId
            shareFrom = self.data.shareFrom
            nickname = self.data.nickname
        }
        if (voteId || shareFrom || nickname) {
            self.setData({
                voteId: voteId,
                shareFrom: shareFrom,
                nickname: nickname
            })
        }
        util.request({
            url: util.baseUrl + '/api/votes/' + voteId,
            method: 'GET',
            header: {
                'accept': 'application/json',
                Authorization: authorization
            },
            success: function(res) {
                let finalVoteImgs = [];
                if (res.data.data.images.length > 0) {
                    res.data.data.images.forEach(function(item, index) {
                        finalVoteImgs[index] = util.baseUrl + item.path;
                    })
                }
                if (res.statusCode === 200) {
                    self.setData({
                        voteTitle: res.data.data.title,
                        voteContent: res.data.data.content,
                        voteImgs: finalVoteImgs,
                        voteOptions: res.data.data.options,
                        voterCount: res.data.data.voters_count,
                        createTime: res.data.time_for_humans
                    })
                    if (res.data.result) {
                        self.setData({
                            voteResult: res.data.result,
                        })
                    }
                    //获取投票头像列表
                    self.getVoterList(self.data.voteId);
                    wx.stopPullDownRefresh()
                    wx.hideNavigationBarLoading()
                }
            },
            fail: function(res) {
                wx.showToast({
                    title: '数据请求失败，请稍后再试',
                    icon: 'none',
                    duration: 1500,
                    mask: true
                })
            }
        })
    },
    onPullDownRefresh: function() {
        let self = this;
        wx.showNavigationBarLoading()
        self.onLoad();
    },
    bindPreviewImage: function(e) {
        let self = this;
        wx.previewImage({
            current: e.currentTarget.dataset.src,
            urls: self.data.voteImgs
        })
    },
    onVote: function(e) {
        let self = this;
        let voteId = e.currentTarget.dataset.id;
        let authorization = wx.getStorageSync('authorization');
        wx.showLoading({
            title: '正在处理，请稍后',
        });
        util.request({
            url: util.baseUrl + '/api/options/' + voteId + '/vote',
            method: 'POST',
            header: {
                'accept': 'application/json',
                Authorization: authorization
            },
            success: function(res) {
                if (res.statusCode === 200) {
                    self.data.voterCount++;
                    self.setData({
                        voteResult: res.data.data,
                        voterCount: self.data.voterCount
                    });
                    //获取投票头像列表
                    self.getVoterList(self.data.voteId);
                }
            },
            fail: function() {
                wx.showToast({
                    title: '投票失败，请稍后再试',
                    icon: 'none',
                    duration: 1500,
                    mask: true
                })
            }
        })
    },
    getVoterList: function(voteId) {
        let self = this;
        let authorization = wx.getStorageSync('authorization');
        util.request({
            url: util.baseUrl + '/api/votes/' + voteId + '/voters',
            method: 'GET',
            header: {
                'content-type': 'application/json',
                'accept': 'application/json',
                Authorization: authorization
            },
            success: function(res) {
                if (res.statusCode === 200) {
                    self.setData({
                        voterDetails: res.data.data.options,
                        voterTitle: res.data.data.title
                    })
                    wx.hideLoading();
                    wx.stopPullDownRefresh()
                    wx.hideNavigationBarLoading()
                }
            },
            fail: function(res) {
                wx.showToast({
                    title: '数据请求失败，请稍后再试',
                    icon: 'none',
                    duration: 1500,
                    mask: true
                })
            }
        })
    },
    targetToIndex: function() {
        wx.navigateTo({
            url: '../index/index',
            success: function(res) {
                console.log(res)
            }
        })
    },
    onShareAppMessage: function(res) {
        let self = this;
        let title = self.data.nickname == true ? self.data.nickname : '朋友';
        return {
            title: title + '等你投一票！',
            path: '/pages/voteDetail/voteDetail?shareFrom=share&voteId=' + self.data.voteId,
            success: function(res) {
                // 转发成功
            },
            fail: function(res) {
                // 转发失败
            }
        }
    }
})
