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

module.exports = {
    formatTime: formatTime,
    baseUrl: baseUrl,
    numberToFixed: numberToFixed
}