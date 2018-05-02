const formatTime = date => {
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    const hour = date.getHours()
    const minute = date.getMinutes()
    const second = date.getSeconds()

    return [year, month, day].map(formatNumber).join('/') + ' ' + [hour, minute, second].map(formatNumber).join(':')
}

const formatNumber = n => {
    n = n.toString()
    return n[1] ? n : '0' + n
}
const numberToFixed = n => {
    n = n.toFixed(2) * 100 + '%'
    return n
}

const baseUrl = 'https://www.minivote.cn'

const app = getApp()

const request = (object) => {
    let token,
        authorization,
        _header,
        _success = object.success,
        hasTokenOnStorage = true

    try {
        authorization = wx.getStorageSync('authorization');
        hasTokenOnStorage = !!authorization
    } catch (e) {
        hasTokenOnStorage = false
    }

    if (!hasTokenOnStorage) return

    _header = {
        'accept': 'application/json',
        Authorization: authorization
    }
    object.header = object.header || _header

    object.success = res => {
        token = res.header.authorization
        wx.setStorageSync('authorization', token)

        if ( res.header.status == 401) {
            wx.showModal({
                content: '登录信息已过期，请重新授权',
                showCancel: false,
                success: function(res) {
                    if (res.confirm) {
                        app.getUserInfo()
                    }
                }
            })
        }

        _success && _success(res)
    }

    wx.request(object)
}

module.exports = {
    formatTime: formatTime,
    baseUrl: baseUrl,
    numberToFixed: numberToFixed,
    request
}
