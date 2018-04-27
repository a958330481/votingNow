//index.js
const util = require('../../utils/util.js')
const app = getApp()
    //用户授权方法调用：app.getUserInfo()
var authorization = wx.getStorageSync('authorization');
Page({
    data: {
        votes: '',
        totalPageNum: 0,
        currentPage: 0,
        bottomLineState: false,
        votedColor: ['#9dc8c8', '#58c9b9', '#519d9e', '#d1b6e1'],
        filterName: 'all'
    },
    onLoad: function() {
        var self = this;
        //首页数据初始化
        self.getVoteList('', 1, 'all');
    },
    onPullDownRefresh: function() {
        let self = this;
        let filterName = self.data.filterName;
        authorization = wx.getStorageSync('authorization');
        console.log('下拉刷新')
        wx.showNavigationBarLoading()
        self.getVoteList('refresh', 1, filterName);
    },
    onReachBottom: function() {
        console.log('滚动条到底部，请求更多数据')
        let self = this;
        let pesoPgNo = self.data.currentPage;
        let filterName = self.data.filterName;
        pesoPgNo++;
        self.setData({
            currentPage: pesoPgNo
        })
        if (self.data.currentPage <= self.data.totalPageNum) {
            self.getVoteList('loadMore', self.data.currentPage, filterName);
        } else {
            self.setData({
                currentPage: self.data.totalPageNum,
                bottomLineState: true
            })
            wx.showToast({
                title: '全部数据已加载，已无更多内容',
                icon: 'none',
                duration: 1500,
                mask: true
            })
            return
        }
    },
    targetToAdd: function() {
        wx.navigateTo({
            url: '../comment/comment',
            success: function(res) {
                console.log(res)
            }
        })
    },
    targetToVoteDetail: function(e) {
        console.log(e);
        let voteId = e.currentTarget.dataset.src;
        console.log(voteId);
        wx.navigateTo({
            url: '../voteDetail/voteDetail?voteId=' + voteId,
            success: function(res) {
                console.log(res)
            }
        })
    },
    onShareAppMessage: function(res) {
        if (res.from === 'button') {
            // 来自页面内转发按钮
            console.log(res.target)
        }
        return {
            title: '朋友等你投一票！',
            path: '/pages/index/index',
            success: function(res) {
                // 转发成功
            },
            fail: function(res) {
                // 转发失败
            }
        }
    },
    getVoteList: function(type, pageNum, filterName) {
        let self = this;
        let totalVotes = self.data.votes;
        let timer = setTimeout(() => {
            wx.showLoading({
                title: '加载中',
            })
        }, 200);
        authorization = wx.getStorageSync('authorization');
        wx.request({
            url: util.baseUrl + '/api/votes',
            method: 'GET',
            header: {
                'content-type': 'application/json',
                'accept': 'application/json',
                Authorization: authorization
            },
            data: {
                page: pageNum,
                filter: filterName
            },
            success: function(res) {
                wx.hideLoading();
                clearTimeout(timer);
                if (res.statusCode === 200) {
                    self.setData({
                        totalPageNum: res.data.meta.last_page
                    });
                    if (type === "loadMore") {
                        totalVotes = totalVotes.concat(res.data.data)
                        self.setData({
                            votes: totalVotes
                        })
                    } else {
                        self.setData({
                            votes: res.data.data
                        })
                    }
                    if (type === "refresh") {
                        wx.showToast({
                            title: '刷新成功',
                            icon: 'success', // loading
                            duration: 1200,
                            mask: true
                        });
                        self.setData({
                            currentPage: 1,
                            bottomLineState: false
                        })
                        wx.stopPullDownRefresh()
                        wx.hideNavigationBarLoading()
                    }
                } else if (res.statusCode === 401) {
                    //app.getUserInfo()
                }
            },
            fail: function() {
                wx.showToast({
                    title: '数据获取失败，请稍后再试',
                    icon: 'none',
                    duration: 1500,
                    mask: true
                })
            }
        })
    },
    onVote: function(e) {
        let self = this;
        let voteId = e.currentTarget.dataset.src;
        let voteIndex = e.currentTarget.dataset.vindex;
        let index = e.currentTarget.dataset.index;
        wx.request({
            url: util.baseUrl + '/api/options/' + voteId + '/vote',
            method: 'POST',
            header: {
                'accept': 'application/json',
                Authorization: authorization
            },
            success: function(res) {
                if (res.statusCode === 200) {
                    self.data.votes[voteIndex].result = res.data
                    self.data.votes[voteIndex].data.voters_count++;
                    self.data.votes[voteIndex].data.options[index].vote_count++;
                    self.setData({
                        votes: self.data.votes
                    })
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
    getVoteListByType: function(e) {
        let self = this;
        let curName = e.currentTarget.dataset.src;
        if (curName) {
            wx.pageScrollTo({
                scrollTop: 0,
                duration: 100
            })
            self.setData({
                filterName: curName,
                currentPage: 1,
                bottomLineState: false
            })
            self.getVoteList('', 1, curName);
        }
    }
})