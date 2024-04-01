document.addEventListener('alpine:init', () => {
	Alpine.data('qtexplorer', () => ({
		_setting: {
			baseUrl: '/filemanager',
			ajaxParam: {
				cmd: '',
				value: '',
				secondaryValue: ''
			},
			setParams(cmd, value = '', secondaryValue = '') {
				this.ajaxParam.cmd = cmd;
				this.ajaxParam.value = value;
				this.ajaxParam.secondaryValue = secondaryValue;
			},
			getUrl() {
				return `${this.baseUrl}?${new URLSearchParams(this.ajaxParam)}`;
			}
		},
		_folderTree: [
			{
				fullPath: '',
				level: 1,
				folderName: '',
				isOpen: true,
				cssClass: {}
			}
		],
		_folderTreeSelectedIndex: -1,

		_panelData: [
			{
				path: '',
				name: '',
				isFolder: false
			}
		],
		_panelItemSelectedIndex: -1,
		_additionalInfo: {
			selectedText: '',
			//...
		},
		_folderUpdinPopup: {
			show: false,
			title: 'Thêm thư mục',
			value: ''
		},

		init() {
			this._setting.setParams("GET_ALL_DIR");
			fetch(this._setting.getUrl())
				.then(res => res.json())
				.then(json => {
					this._folderTree = json.data.map(path => {
						// tách chuỗi thành mảng, dựa theo dấu \
						var tmpArr = path.split("\\");
						return {
							folderName: tmpArr[tmpArr.length - 1],	// Phần tử cuối
							fullPath: path,
							level: tmpArr.length,
							isOpen: false,
							cssClass: {
								[`folder-level-${tmpArr.length}`]: true,
								show: false
							}
						}
					});
				});
		},

		toggleFolder(idx) {

			// Hiển thị những thư mục có level lớn hơn level hiện tại 1 đơn vị
			if (idx >= this._folderTree.length) {
				return;
			}
			this._folderTree[idx].isOpen = !this._folderTree[idx].isOpen;
			var currentLevel = this._folderTree[idx].level;
			this.openFolder(idx, currentLevel);
		},

		openFolder(idx, maxLevel) {
			var isOpen = this._folderTree[idx].isOpen;

			if (isOpen) {
				// Mở thư mục
				while (idx + 1 < this._folderTree.length && this._folderTree[idx + 1].level > maxLevel) {
					if (maxLevel + 1 == this._folderTree[idx + 1].level) {
						this._folderTree[idx + 1].cssClass.show = true;
						if (this._folderTree[idx + 1].isOpen) {
							// Đệ quy
							this.openFolder(idx + 1, this._folderTree[idx + 1].level);
						}
					}
					idx++;
				}
			} else {
				// Đóng thư mục
				while (idx + 1 < this._folderTree.length && this._folderTree[idx + 1].level > maxLevel) {
					this._folderTree[idx + 1].cssClass.show = false;
					idx++;
				}
			}
		},

		getAllInDir(fullPath, idx) {
			this._panelItemSelectedIndex = -1;
			this._folderTreeSelectedIndex = idx;
			this._setting.setParams("GET_ALL_IN_DIR", fullPath);
			fetch(this._setting.getUrl())
				.then(res => res.json())
				.then(json => {
					if (json.success) {
						this._panelData = json.data;
					}
				});
		},

		getIcon(isFolder) {
			let icon = 'file-solid.svg';
			if (isFolder) {
				icon = 'folder-solid.svg';
			}
			return '/lib/qtexplorer/icon/' + icon;
		},

		setSelectedItem(f, idx) {
			this._panelItemSelectedIndex = idx;
			this._additionalInfo.selectedText = this._panelData[idx].name;
		},

		deleteSelectedItem() {
			let idx = this._panelItemSelectedIndex;
			if (idx < 0 || !this._panelData[idx]) {
				alert("Chưa chọn file hoặc thư mục");
				return;
			}

			this._setting.setParams("DELETE_ITEM", this._panelData[idx].path);
			fetch(this._setting.getUrl())
				.then(res => res.json())
				.then(json => {
					if (json.success) {
						let isFolder = this._panelData[idx].isFolder;
						let fullPath = this._panelData[idx].path;
						// Xóa item được chọn khỏi panelData
						this._panelData.splice(idx, 1);

						// Xóa khỏi cây thư mục nếu là folder
						if (isFolder) {
							// Tìm lại index trên cây thư mục
							let startIdx = this._folderTree.findIndex(item => item.fullPath == fullPath);
							idx = startIdx;
							if (idx >= 0) {
								let level = this._folderTree[idx].level;
								let cntDel = 1;
								while (idx + 1 < this._folderTree.length && this._folderTree[idx + 1].level > level) {
									cntDel++;
									idx++;
								}

								this._folderTree.splice(startIdx, cntDel);
							}
						}
						this._panelItemSelectedIndex = -1;
					}
				});
		},

		//Mở thư mục popup:
		openFolderUpdinPopup() {
			this._folderUpdinPopup.show = true;
			this._folderUpdinPopup.value = 'NewFolder';
		},
		//Thoát popup:
		closeFolderUpdinPopup() {
			this._folderUpdinPopup.show = false;
		},
		//Updin popup:
		updinFolder() {
			let i = this._folderTreeSelectedIndex;
			let newFolderName = this._folderUpdinPopup.value;

			if (!newFolderName) {
				alert("Chưa nhập tên thư mục");
				return;
			}

			let newFolderPath = this._folderTree[i].fullPath + "\\" + newFolderName;

			this._setting.setParams("ADD_NEW_FOLDER", newFolderPath);
			fetch(this._setting.getUrl())
				.then(res => res.json())
				.then(json => {
					if (json.success) {
						// Xử lý thêm
						var pannelItem = {
							path: newFolderPath,
							name: newFolderName,
							isFolder: true
						};
						this._panelData.unshift(pannelItem);
						
						//thêm vào cây thư mục
						var FolderFreeItem = {
							fullPath: newFolderPath,
							level: this._folderTree[i].level + 1,
							folderName: newFolderName,
							isOpen: false,
							cssClass: {
								[`folder-level-${this._folderTree[i].level + 1}`]: true,
								show: this._folderTree[i].isOpen
							}
						}
						this._folderTree.splice(i + 1, 0, FolderFreeItem);
						//Hàm đóng popup:
						this.closeFolderUpdinPopup();
						
					} else {
						alert(json.message);
					}
				});
		}
	}));
});


