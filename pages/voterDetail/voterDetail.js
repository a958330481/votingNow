const util = require('../../utils/util.js')
Page({
    data: {
        voteDetails: '',
        voteId: '',
        voteTitle: ''
    },
    onLoad: function(option) {
        let self = this;
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
        util.request({
            url: util.baseUrl + '/api/votes/' + voteId + '/voters',
            method: 'GET',
            success: function(res) {
                if (res.statusCode === 200) {
                    self.setData({
                        voteDetails: res.data.data,
                        voteTitle: res.data.data.title
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
