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
        avatarUrl: [],
        desTextareaData: '',
        voteTypeChoosed: 0,
        userAuthorization: '',
        voteTitleLen: 0,
        voteDesLen: 0,
        voteImgs: [],
        voteTypes: [
            { name: 'F', value: '公开', checked: true },
            { name: 'T', value: '私密' }
        ]
    },
    radioChange: function(e) {
        let self = this;
        let choosedValue = e.detail.value;
        self.setData({
            voteTypeChoosed: choosedValue
        })
        console.log('radio发生change事件，携带value值为：', self.data.voteTypeChoosed)
    },
    bindTitleInput: function(e) {
        let self = this;
        self.setData({
            newVoteTitle: e.detail.value,
            voteTitleLen: e.detail.cursor
        })
        console.log(e.detail.cursor)
    },
    bindDesTextAreaInput: function(e) {
        var self = this;
        self.setData({
            desTextareaData: e.detail.value
        })
        console.log(e.detail.cursor)
    },
    bindTextAreaInput: function(e) {
        var self = this;
        //console.log(e.detail.value + ":" + e.detail.cursor)
        self.setData({
            newVoteWords: e.detail.cursor,
            newVoteContent: e.detail.value
        })
        if (self.data.newVoteWords === 30) {
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
        let voteImg = this.data.avatarUrl;
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
        if (voteImg.length === 1) {
            voteItem.image_url = voteImg[0];
        } else {
            voteItem.image_url = '';
        }
        self.data.newVotes.push(voteItem);
        console.log(self.data.newVotes);
        self.setData({
            desTextareaState: !self.data.desTextareaState,
            addNewVoteState: !self.data.addNewVoteState,
            newVoteContent: '',
            newVotes: self.data.newVotes,
            addNewVoteState: false,
            newVoteWords: 0,
            avatarUrl: []
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
            avatarUrl: []
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
        wx.chooseImage({
            count: 2, // 最多可以选择的图片张数，默认9
            sizeType: ['compressed'], // original 原图，compressed 压缩图，默认二者都有
            sourceType: ['album', 'camera'], // album 从相册选图，camera 使用相机，默认二者都有
            success: function(res) {
                // success
                var tempFilePaths = res.tempFilePaths
                console.log(tempFilePaths[0]);
                self.data.voteImgs.push(tempFilePaths[0]);
                self.setData({
                    avatarUrl: tempFilePaths,
                    voteImgs: self.data.voteImgs
                })
                console.log(self.data.voteImgs)
                wx.showToast({
                    title: '图片上传成功',
                    icon: 'success',
                    duration: 1500
                })
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
        console.log(e.currentTarget.dataset.src)
    },
    delImage: function(e) {
        let i = e.currentTarget.dataset.index;
        let self = this;
        let voteImgs = self.data.voteImgs;
        wx.showModal({
            title: '温馨提示',
            content: '确认删除该张图片？',
            success: function(res) {
                if (res.confirm) {
                    voteImgs.splice(i, 1)
                    self.setData({
                            voteImgs: voteImgs
                        })
                        //todo:图片删除接口
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
        let authorization = self.data.userAuthorization;
        if (newVoteTitle == "") {
            wx.showToast({
                title: '请输入【投票标题】后再提交',
                icon: 'none',
                duration: 1500
            })
            return;
        }
        if (newVotes.length === 0) {
            wx.showToast({
                title: '请添加【投票选项】后再提交',
                icon: 'none',
                duration: 1500
            })
            return;
        }
        wx.setStorage({
            key: "newVoteInfo",
            data: {
                'newVoteTitle': newVoteTitle,
                'voteTypeChoosed': voteTypeChoosed,
                'desTextareaData': desTextareaData,
                'newVotes': newVotes,
                'createTime': createTime
            },
            success: function() {
                wx.request({
                    url: util.baseUrl + '/api/votes',
                    data: {
                        title: newVoteTitle,
                        is_private: voteTypeChoosed,
                        content: desTextareaData,
                        options: newVotes
                    },
                    method: 'POST',
                    header: {
                        'accept': 'application/json',
                        Authorization: authorization
                    },
                    success: function(res) {
                        console.log(res)
                        if (res.statusCode === 200) {
                            wx.showToast({
                                title: '发布成功',
                                icon: 'success',
                                duration: 1500,
                                mask: true
                            })
                            wx.navigateTo({
                                url: '../index/index'
                            })
                        }
                    }
                })
            }
        })
    }
})