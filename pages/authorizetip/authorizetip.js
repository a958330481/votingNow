const util = require('../../utils/util.js')
const app = getApp()
Page({
    //跳转设置页面授权
    onGotUserInfo: function(e) {
        if (e.detail.errMsg.indexOf('ok') > -1) {
            wx.showToast({
                title: '授权成功',
                icon: 'success',
                duration: 1500,
                mask: true
            })
            wx.getSetting({
                success: function(res) {
                    if (res.authSetting['scope.userInfo']) {
                        wx.showToast({
                            title: '授权成功',
                            icon: 'success',
                            duration: 1500,
                            mask: true
                        });
                        //尝试再次登录
                        wx.reLaunch({
                            url: '/pages/index/index'
                        })
                        app.userAuthCb();
                    } else {
                        return;
                    }
                }
            })
        } else {
            wx.showToast({
                title: '授权失败',
                icon: 'none',
                duration: 1500,
                mask: true
            })
        }
    }
})