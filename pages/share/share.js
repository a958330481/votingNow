//logs.js
const util = require('../../utils/util.js')

Page({
    data: {
        logs: []
    },
    onLoad: function() {
        wx.redirectTo({
            url: '../index/index',
            success: function(res) {
                // success
            }
        })
    }
})