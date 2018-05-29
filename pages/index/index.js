//index.js
const util = require('../../utils/util.js')
const app = getApp()
    //用户授权方法调用：app.getUserInfo()
let authorization = wx.getStorageSync('authorization');
Page({
    data: {
        votes: '',
        totalPageNum: 0,
        currentPage: 1,
        bottomLineState: false,
        votedColor: ['#9dc8c8', '#58c9b9', '#519d9e', '#d1b6e1'],
        filterName: 'all',
        delOpState: false,
        pullDownState: true,
        voteState: true
    },
    onLoad: function(option) {
        let self = this;
        let funType;
        //首页数据初始化
        if (option) {
            funType = option.funType
            if (funType) {
                self.setData({
                    filterName: funType
                })
            }
        } else {
            funType = self.data.filterName
        }
        self.getVoteList('', 1, funType);
    },
    onShow: function() {
        let self = this;
        let type = self.data.filterName || 'all';
        //同步投票结果
        let targetIndex = wx.getStorageSync('voteIndex');
        let targetResult = wx.getStorageSync('voteResult');
        let optionIndex = wx.getStorageSync('optionIndex') === "" ? -1 : wx.getStorageSync('optionIndex');
        if (targetIndex && optionIndex >= 0) {
            self.data.votes[targetIndex].data.voters_count++;
            self.data.votes[targetIndex].result = targetResult;
            self.data.votes[targetIndex].data.options[optionIndex].vote_count++;
            self.setData({
                votes: self.data.votes
            }, function() {
                //清除缓存信息
                wx.removeStorageSync('voteIndex');
                wx.removeStorageSync('voteResult');
                wx.removeStorageSync('optionIndex');
            });
        }
    },
    onPullDownRefresh: function() {
        let self = this;
        let filterName = self.data.filterName;
        authorization = wx.getStorageSync('authorization');
        wx.showNavigationBarLoading();
        if (self.data.pullDownState) {
            self.getVoteList('refresh', 1, filterName);
        }
    },
    onReachBottom: function() {
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
                /*
                wx.showToast({
                    title: '全部数据已加载，已无更多内容',
                    icon: 'none',
                    duration: 1500,
                    mask: true
                })*/
            return
        }
    },
    targetToAdd: function() {
        wx.navigateTo({
            url: '/pages/comment/comment',
            success: function(res) {
                console.log(res)
            }
        })
    },
    targetToVoteDetail: function(e) {
        let voteId = e.currentTarget.dataset.src;
        let curIndex = e.currentTarget.dataset.index;
        console.log(curIndex)
        wx.setStorageSync('voteIndex', curIndex)
        wx.navigateTo({
            url: '/pages/voteDetail/voteDetail?shareFrom=index&nickname&voteId=' + voteId,
            success: function(res) {
                console.log(res)
            }
        })
    },
    onShareAppMessage: function(res) {
        let self = this;
        let nickname = res.target.dataset.nickname;
        let voteId = res.target.dataset.voteid;
        let shareTitle = nickname ? nickname : '朋友';
        if (res.from === 'button') {
            // 来自页面内转发按钮
            console.log(res)
        }
        return {
            title: shareTitle + '等你投一票！',
            path: '/pages/voteDetail/voteDetail?shareFrom=share&nickname=' + nickname + '&voteId=' + voteId,
            success: function(res) {
                // 转发成功
            }
        }
    },
    bindPreviewImage: function(e) {
        let self = this;
        let imgs = e.currentTarget.dataset.images;
        let finalImgs = [];
        imgs.forEach(function(item, index) {
            finalImgs[index] = util.baseUrl + item.path;
        })
        wx.previewImage({
            current: e.currentTarget.dataset.src,
            urls: finalImgs
        })
    },
    getVoteList: function(type, pageNum, filterName) {
        let self = this;
        let totalVotes = self.data.votes;
        let authorization = wx.getStorageSync('authorization');
        let timer = setTimeout(() => {
            wx.showLoading({
                title: '加载中',
            })
        }, 400);
        self.setData({
            pullDownState: false
        });
        util.request({
            url: util.baseUrl + '/api/votes',
            method: 'GET',
            data: {
                page: pageNum,
                filter: filterName
            },
            success: function(res) {
                wx.hideLoading();
                clearTimeout(timer);
                if (res.statusCode === 200) {
                    self.setData({
                        totalPageNum: res.data.meta.last_page,
                        votes: res.data.data,
                        pullDownState: true
                    });
                    if (type === "loadMore") {
                        totalVotes = totalVotes.concat(res.data.data)
                        self.setData({
                            votes: totalVotes
                        })
                    } else if (type === "refresh") {
                        wx.showToast({
                            title: '刷新成功',
                            icon: 'success',
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
        if (self.data.voteState) {
            self.setData({
                voteState: false
            })
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
                        self.data.votes[voteIndex].result = res.data
                        self.data.votes[voteIndex].data.voters_count++;
                        self.data.votes[voteIndex].data.options[index].vote_count++;
                        self.setData({
                            votes: self.data.votes,
                            voteState: true
                        })
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
        } else {
            wx.showToast({
                title: '您已投票，无需再投',
                icon: 'none',
                duration: 1500,
                mask: true
            })
        }
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
    },
    voteOP: function(e) {
        let voteIndex = e.currentTarget.dataset.index;
        let voteId = e.currentTarget.dataset.voteid;
        let self = this;
        let delData;
        self.setData({
            //操作按钮变为选中状态；让用户区分自己所选那条
            delOpState: true
        })
        wx.showActionSheet({
            itemList: ['删除该项投票内容'],
            itemColor: '#d81e06',
            success: function(res) {
                if (res.tapIndex === 0) {
                    util.request({
                        url: util.baseUrl + '/api/votes/' + voteId,
                        method: 'DELETE',
                        success: function(res) {
                            if (res.statusCode === 200) {
                                self.data.votes.splice(voteIndex, 1)
                                if (self.data.votes.length === 0) {
                                    self.setData({
                                        bottomLineState: false
                                    })
                                }
                                self.setData({
                                    votes: self.data.votes,
                                    delOpState: false
                                })
                                wx.showToast({
                                    title: '删除成功',
                                    icon: 'success',
                                    duration: 1500,
                                    mask: true
                                })
                            }
                        }
                    })
                }
            },
            fail: function(res) {
                self.setData({
                    delOpState: false
                })
            }
        })
    }
})