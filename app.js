App({
    globalData: {
        userInfo: null,
        encryptedData: '',
        iv: '',
        userAuthorization: ''
    },
    //启动
    onLaunch: function() {
        this.getUserInfo();
    },
    //获取用户信息
    getUserInfo: function() {
        var self = this
        wx.getSetting({
            success(res) {
                //判断用户是否已授权获取用户信息
                if (res.authSetting['scope.userInfo']) {
                    //已授权,可以直接获取用户信息不用弹框
                    self.userAuthCb();
                } else {
                    //未授权
                    console.log(666666666666666666666)
                    wx.authorize({
                        scope: 'scope.userInfo',
                        success() {
                            // 用户已经同意小程序获取用户信息
                            self.userAuthCb();
                        }
                    })
                }
            }
        })
    },
    userAuthCb: function() {
        var that = this
        wx.getUserInfo({
            success: function(res) {
                that.globalData.userInfo = res.userInfo;
                that.globalData.encryptedData = res.encryptedData;
                that.globalData.iv = res.iv;
                if (res.encryptedData && res.iv) {
                    wx.login({
                        success: function(res) {
                            if (res.code) {
                                //将用户基本信息回传给服务器，并获取assess_token
                                wx.request({
                                    url: 'https://www.minivote.cn/auth/api/token',
                                    method: 'POST',
                                    data: {
                                        code: res.code,
                                        encryptedData: that.globalData.encryptedData,
                                        iv: that.globalData.iv
                                    },
                                    header: {
                                        'accept': 'application/json' // 默认值
                                    },
                                    success: function(res) {
                                        console.log(res.data)
                                        let authorizationValue = res.data.access_token;
                                        if (authorizationValue) {
                                            wx.setStorage({
                                                key: 'authorization',
                                                data: "Bearer " + authorizationValue
                                            })
                                            that.globalData.userAuthorization = "Bearer " + authorizationValue
                                            console.log(that.globalData.userAuthorization)
                                        } else {
                                            console.log('身份验证失败')
                                        }
                                    }
                                })
                            }
                        }
                    })
                }
            }
        })
    }
})