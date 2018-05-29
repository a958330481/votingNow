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
                        });
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
        let optionIndex = e.currentTarget.dataset.index;
        console.log(optionIndex);
        wx.showToast({
            title: '处理中，请稍后...',
            icon: 'none',
            duration: 1500,
            mask: true
        })
        util.request({
            url: util.baseUrl + '/api/options/' + voteId + '/vote',
            method: 'POST',
            success: function(res) {
                if (res.statusCode === 200) {
                    self.data.voterCount++;
                    self.setData({
                        voteResult: res.data.data,
                        voterCount: self.data.voterCount
                    });
                    //投票结果缓存到本地
                    console.log(res.data.data)
                    wx.setStorage({
                        key: 'optionIndex',
                        data: optionIndex
                    })
                    wx.setStorage({
                        key: 'voteResult',
                        data: res.data.data
                    });
                    //获取投票头像列表
                    self.getVoterList(self.data.voteId);
                    wx.hideToast()
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
        util.request({
            url: util.baseUrl + '/api/votes/' + voteId + '/voters',
            method: 'GET',
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
            url: '/pages/index/index',
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