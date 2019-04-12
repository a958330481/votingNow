//index.js
const util = require('../../utils/util.js')

Page({
    data: {
        votes: [],
        totalPageNum: 0,
        currentPage: 1,
        bottomLineState: false,
        votedColor: ['#9dc8c8', '#58c9b9', '#519d9e', '#d1b6e1'],
        filterName: 'all',
        delOpState: false,
        pullDownState: true,
        voteState: true,
        noVoteFlag: false,
        pullDownRefreshState: false
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
                self.getVotes(funType);
            }
        } else {
            funType = self.data.filterName
            self.getVotes(funType);
        }
    },
    onShow: function() {
        let self = this;
        let type = self.data.filterName || 'all';
        //同步投票结果
        let targetIndex = wx.getStorageSync('voteIndex');
        let targetResult = wx.getStorageSync('voteResult');
        let optionIndex = wx.getStorageSync('optionIndex') === "" ? -1 : wx.getStorageSync('optionIndex');
        if (targetIndex >= 0 && optionIndex >= 0) {
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

        self.setData({
            pullDownRefreshState: true,
            bottomLineState: false,
            currentPage: 1
        })
        self.getVotes(filterName);
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
            self.getVotes(filterName);
        } else {
            self.setData({
                currentPage: self.data.totalPageNum,
                bottomLineState: true
            });
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
        let nickname = e.currentTarget.dataset.nickname;
        wx.setStorageSync('voteIndex', curIndex)
        wx.navigateTo({
            url: '/pages/voteDetail/voteDetail?shareFrom=index&nickname=' + nickname + '&voteId=' + voteId,
            success: function(res) {
                console.log(res)
            }
        })
    },
    onShareAppMessage: function(res) {
        let shareTitle = res.target.dataset.title;
        let nickname = res.target.dataset.nickname;
        let voteId = res.target.dataset.voteid;
        let cover;
        if (res.target.dataset.cover.includes('undefined')) {
            cover = '../../images/cover.png'
        } else {
            cover = res.target.dataset.cover
        }
        return {
            title: shareTitle,
            path: '/pages/voteDetail/voteDetail?shareFrom=share&nickname=' + nickname + '&voteId=' + voteId,
            imageUrl: cover,
            success: function(res) {
                wx.showToast({
                    title: '分享成功',
                    icon: 'success',
                    duration: 1500,
                    mask: true
                })
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
    getVotes: function(filterName) {
        let self = this;
        wx.showNavigationBarLoading();
        util.request({
            url: util.baseUrl + '/api/votes',
            method: 'GET',
            data: {
                page: self.data.currentPage,
                filter: filterName
            },
            success: function(res) {
                wx.stopPullDownRefresh()
                wx.hideNavigationBarLoading()
                if (res.statusCode === 200) {
                    if (self.data.pullDownRefreshState) {
                        //下拉刷新
                        self.setData({
                            totalPageNum: res.data.meta.last_page,
                            votes: res.data.data,
                            pullDownRefreshState: false
                        });
                    } else {
                        //上拉加载
                        self.setData({
                            totalPageNum: res.data.meta.last_page,
                            votes: self.data.votes.concat(res.data.data)
                        });
                    }
                    //判断votes长度是否为0
                    if (self.data.votes.length === 0) {
                        self.setData({
                            noVoteFlag: true
                        })
                    }
                }
            },
            fail: function() {
                wx.stopPullDownRefresh()
                wx.hideNavigationBarLoading()
                wx.showToast({
                    title: '网络异常，请稍后再试',
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
                bottomLineState: false,
                votes: []
            })
            self.getVotes(curName);
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