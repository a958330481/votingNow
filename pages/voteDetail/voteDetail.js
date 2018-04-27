const util = require('../../utils/util.js')
Page({
    data: {
        voteDetails: '',
        voteId: ''
    },
    onLoad: function(option) {
        let self = this;
        let authorization = wx.getStorageSync('authorization');
        let voteId;
        if (option) {
            voteId = option.voteId
        } else {
            voteId = self.data.voteId
        }
        if (voteId) {
            self.setData({
                voteId: voteId
            })
        }
        wx.request({
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
                        voteDetails: res.data.data
                    })
                    wx.stopPullDownRefresh()
                    wx.hideNavigationBarLoading()
                }
            },
            fail: function(res) {
                console.log(res)
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
    }
})