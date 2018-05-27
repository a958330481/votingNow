//logs.js
const util = require('../../utils/util.js')

Page({
    data: {
        newVoteTitle: '',
        desTextareaState: false,
        addNewVoteState: false,
        textareaFocusFlag: false,
        newVoteWords: 0,
        newVoteWordsState: false,
        newVoteContent: '',
        newVotes: [],
        desTextareaData: '',
        voteTypeChoosed: 0,
        voteTitleLen: 0,
        voteDesLen: 0,
        desTextareaDataLen: 0,
        voteImgs: [],
        voteImgPaths: [],
        saveBtnState: true,
        voteTypes: [
            { name: 'F', value: '公开', checked: true },
            { name: 'T', value: '私密' }
        ]
    },
    radioChange: function(e) {
        let self = this;
        let choosedValue = e.detail.value;
        if (e.detail.value === "T") {
            wx.showModal({
                content: '私密投票只有自己和被分享的朋友才能看到哦~',
                success: function(res) {
                    if (res.confirm) {
                        self.setData({
                            voteTypeChoosed: choosedValue
                        })
                        return;
                    } else if (res.cancel) {
                        self.setData({
                            voteTypes: [
                                { name: 'F', value: '公开', checked: true },
                                { name: 'T', value: '私密' }
                            ]
                        })
                    }
                }
            })
        } else {
            self.setData({
                voteTypeChoosed: choosedValue
            })
        }
    },
    bindTitleInput: function(e) {
        let self = this;
        self.setData({
            newVoteTitle: e.detail.value,
            voteTitleLen: e.detail.cursor
        })
    },
    bindDesTextAreaInput: function(e) {
        let self = this;
        let desTextLen = e.detail.cursor;
        self.setData({
            desTextareaData: e.detail.value,
            desTextareaDataLen: e.detail.cursor
        })
    },
    bindTextAreaInput: function(e) {
        var self = this;
        self.setData({
            newVoteWords: e.detail.cursor,
            newVoteContent: e.detail.value
        })
        if (self.data.newVoteWords === 20) {
            self.setData({
                newVoteWordsState: true
            })
        } else {
            self.setData({
                newVoteWordsState: false
            })
        }
    },
    onLoad: function() {
        let self = this;
        let authorization = wx.getStorageSync('authorization');
        self.setData({
            userAuthorization: authorization
        })
    },
    addNewVote: function() {
        var self = this;
        self.setData({
            desTextareaState: !this.data.desTextareaState,
            addNewVoteState: !this.data.addNewVoteState,
        })
    },
    confirmAddNewVote: function() {
        let voteContent = this.data.newVoteContent;
        let voteItem = {};
        var self = this;
        if (voteContent) {
            voteItem.title = voteContent;
        } else {
            wx.showToast({
                title: '请填写选项内容',
                icon: 'none',
                duration: 1500
            })
            setTimeout(function() {
                wx.hideLoading()
            }, 2000)
            return;
        }
        self.data.newVotes.push(voteItem);
        self.setData({
            desTextareaState: !self.data.desTextareaState,
            addNewVoteState: !self.data.addNewVoteState,
            newVoteContent: '',
            newVotes: self.data.newVotes,
            addNewVoteState: false,
            newVoteWords: 0,
        });

    },
    closeMask: function() {
        var self = this;
        self.setData({
            addNewVoteState: false,
            newVoteContent: '',
            newVoteWords: 0,
            newVoteWordsState: false,
            desTextareaState: false,
        })
    },
    showMask: function() {
        var self = this;
        self.setData({
            addNewVoteState: false
        })
    },
    bindTextAreablur: function() {
        var self = this;
        self.setData({
            textareaFocusFlag: false
        })
    },
    bindTextAreaFocus: function() {
        this.setData({
            textareaFocusFlag: true
        })
    },
    uploadImg: function() {
        var self = this;
        let authorization = wx.getStorageSync('authorization');

        wx.chooseImage({
            count: 1, // 最多可以选择的图片张数
            sizeType: ['compressed'], // compressed 压缩
            sourceType: ['album', 'camera'], // album 从相册选图，camera 使用相机，默认二者都有
            success: function(res) {
                let tempFilePaths = res.tempFilePaths
                wx.showLoading({
                    title: '图片正在上传',
                });
                util.request({ // 防止 token 过期
                    url: util.baseUrl + '/api/me',
                    method: 'GET',
                    success: function(res) {
                        self.data.userAuthorization = wx.getStorageSync('authorization');

                        wx.uploadFile({
                            url: util.baseUrl + '/api/images/store',
                            filePath: tempFilePaths[0],
                            name: 'image',
                            header: {
                                Authorization: authorization
                            },
                            formData: {
                                'image': tempFilePaths[0]
                            },
                            success: function(res) {
                                let resData = JSON.parse(res.data);
                                let pathObj = {};
                                if (res.statusCode === 200) {
                                    let imgUrl = resData.host + resData.path;
                                    wx.hideLoading();
                                    wx.showToast({
                                        title: '成功',
                                        icon: 'success'
                                    });
                                    self.data.voteImgs.push(imgUrl);
                                    pathObj.path = resData.path;
                                    self.data.voteImgPaths.push(pathObj);
                                    self.setData({
                                        voteImgs: self.data.voteImgs,
                                        voteImgPaths: self.data.voteImgPaths
                                    })
                                } else {
                                    wx.showModal({
                                        title: '提示',
                                        content: '上传失败,请重新上传',
                                        showCancel: false
                                    })
                                }
                            },
                            complete: function() {
                                wx.hideToast();
                            }
                        })
                    }
                });
            },
            fail: function() {
                wx.showToast({
                    title: '图片上传失败，请稍后再次上传',
                    icon: 'none',
                    duration: 1500
                })
            }
        })
    },
    bindPreviewImage: function(e) {
        var self = this;
        wx.previewImage({
            current: e.currentTarget.dataset.src, // 当前显示图片的http链接
            urls: self.data.voteImgs // 需要预览的图片http链接列表
        })
    },
    delImage: function(e) {
        let self = this;
        let i = e.currentTarget.dataset.index;
        let path = e.currentTarget.dataset.path;
        let voteImgs = self.data.voteImgs;
        wx.showModal({
            title: '温馨提示',
            content: '确认删除该张图片？',
            success: function(res) {
                if (res.confirm) {
                    util.request({
                        url: util.baseUrl + '/api/image?path=' + path,
                        method: 'DELETE',
                        success: function(res) {
                            if (res.statusCode === 200) {
                                wx.showToast({
                                    title: '图片删除成功',
                                    icon: 'success'
                                });
                                voteImgs.splice(i, 1)
                                self.data.voteImgPaths.splice(i, 1)
                                self.setData({
                                    voteImgs: voteImgs,
                                    voteImgPaths: self.data.voteImgPaths
                                })
                            }
                        },
                        complete: function() {
                            wx.hideToast();
                        }
                    })
                }
            }
        })
    },
    confirmDelItem: function(e) {
        let self = this;
        let index = e.currentTarget.dataset.index;
        let delData = self.data.newVotes;
        wx.showModal({
            title: '温馨提示',
            content: '确认删除该投票选项？',
            success: function(res) {
                if (res.confirm) {
                    delData.splice(index, 1)
                    self.setData({
                        newVotes: delData
                    })
                }
            }
        })
    },
    publishNewVote: function() {
        /**
         * 标题：newVoteTitle
         * 类型：voteTypeChoosed
         * 描述：desTextareaData
         * 选项：newVotes
         */
        let self = this;
        let newVoteTitle = self.data.newVoteTitle;
        let voteTypeChoosed = self.data.voteTypeChoosed == 0 ? 'F' : self.data.voteTypeChoosed;
        let desTextareaData = self.data.desTextareaData;
        let newVotes = self.data.newVotes;
        let createTime = util.formatTime(new Date());
        if (newVoteTitle == "") {
            wx.showToast({
                title: '请输入【投票标题】后再提交',
                icon: 'none',
                duration: 1500
            })
            return;
        } else if (self.data.voteTitleLen < 3) {
            wx.showToast({
                title: '【投票标题】至少三个字',
                icon: 'none',
                duration: 1500
            })
            return;
        }
        if (newVotes.length < 2) {
            wx.showToast({
                title: '【投票选项】至少两项！',
                icon: 'none',
                duration: 1500
            })
            return;
        }
        self.setData({
            saveBtnState: false
        });
        util.request({
            url: util.baseUrl + '/api/votes',
            data: {
                title: newVoteTitle,
                is_private: voteTypeChoosed,
                content: desTextareaData,
                options: newVotes,
                images: self.data.voteImgPaths
            },
            method: 'POST',
            success: function(res) {
                if (res.statusCode === 422) {
                    self.setData({
                        saveBtnState: true
                    });
                    wx.showModal({
                        content: '投票内容包含敏感信息;请先修改再发布',
                        showCancel: false,
                        confirmColor: '#7087f4'
                    });
                    return;
                }
                if (res.statusCode === 200) {
                    self.setData({
                        saveBtnState: true
                    })
                    wx.showToast({
                        title: '发布成功',
                        icon: 'success',
                        duration: 1500,
                        mask: true
                    })
                    if (self.data.voteTypeChoosed === 'T') {
                        wx.reLaunch({
                            url: '/pages/index/index?funType=mine'
                        })
                    } else {
                        wx.reLaunch({
                            url: '/pages/index/index?funType=all'
                        })
                    }
                }
            }
        })
    }
})