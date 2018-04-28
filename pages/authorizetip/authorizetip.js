//logs.js
const util = require('../../utils/util.js')
const app = getApp()
Page({
    data: {
        logs: []
    },
    onLoad: function() {

    },
    //跳转设置页面授权
    openSetting: function() {
        var that = this
        if (wx.openSetting) {
            wx.openSetting({
                success: function(res) {
                    if (res.authSetting['scope.userInfo']) {
                        wx.showToast({
                            title: '授权成功',
                            icon: 'success',
                            duration: 1500,
                            mask: true
                        });
                        //尝试再次登录
                        wx.navigateTo({
                            url: '../index/index'
                        })
                        app.userAuthCb();
                    } else {
                        return;
                    }
                }
            })
        } else {
            wx.showModal({
                title: '授权提示',
                content: '小程序需要您的微信授权才能使用哦~ 错过授权页面的处理方法：删除小程序->重新搜索进入->点击授权按钮'
            })
        }
    }
})