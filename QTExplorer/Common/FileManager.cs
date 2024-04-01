﻿using Microsoft.AspNetCore.Mvc;

namespace QTExplorer.Common
{
	public class FileManager
	{
		protected string _rootPath;
		protected string _command;
		protected string _value;
		// Dùng trong trường hợp đổi tên/di chuyển file
		protected string _secondaryValue;
		public FileManager(string rootPath, HttpRequest request)
		{
			_rootPath = rootPath;
			_command = request.Query["cmd"].ToString();
			_value = request.Query["value"].ToString();
			_secondaryValue = request.Query["secondaryValue"].ToString();
		}

		public FMResponse ExecuteCmd()
		{
			FMResponse response = new();
			try
			{
				switch (_command)
				{
					case "GET_ALL_DIR":
						{
							response.Data = GetAllDirs();
							break;
						}
					case "GET_ALL_IN_DIR":
						{
							response.Data = GetAllInDir(_value);
							break;
						}
					case "DELETE_ITEM":
						{
							DeleteItem(_value);
							break;
						}
					case "ADD_NEW_FOLDER":
						{
							AddNewFolder(_value);
							break;
						}
					default:
						break;
				}
			}
			catch (Exception ex)
			{
				response.Success = false;
				response.Message = ex.Message;
				response.Data = null;
			}
			return response;
		}
		#region Code
		protected List<string> GetAllDirs()
		{
			var dirs = Directory.GetDirectories(_rootPath, "*", SearchOption.AllDirectories).ToList();
			for (int i = 0; i < dirs.Count; i++)
			{
				dirs[i] = dirs[i].Replace(_rootPath, string.Empty)
								.Trim(Path.DirectorySeparatorChar);
			}

			// Ưu tiên ký tự "\" khi sắp xếp
			dirs.Sort((string a, string b) =>
			{
				for (int i = 0; i < a.Length; i++)
				{
					if (i >= b.Length) return 1;
					if (a[i] != b[i])
					{
						if (a[i] == '\\') return -1;
						if (b[i] == '\\') return 1;
						return a[i] - b[i];
					}
				}
				return a.Length - b.Length;
			});
			return dirs;
		}
		protected List<FMFolderItem> GetAllInDir(string folder)
		{
			var result = new List<FMFolderItem>();
			var fullPath = Path.Combine(_rootPath, folder);

			var dirs = Directory.GetDirectories(fullPath)
						.Select(d => new FMFolderItem
						{
							Path = d.Replace(_rootPath + "\\", ""),
							Name = Path.GetFileName(d),
							IsFolder = true
						});
			var files = Directory.GetFiles(fullPath)
						.Select(f => new FMFolderItem
						{
							Path = f.Replace(_rootPath + "\\", ""),
							Name = Path.GetFileName(f),
							IsFolder = false
						});

			result.AddRange(dirs);
			result.AddRange(files);

			return result;
		}

		protected void DeleteItem(string path)
		{
			path = Path.Combine(_rootPath, path);
			if (File.Exists(path))
			{
				File.Delete(path);
			}else if (Directory.Exists(path))
			{
				Directory.Delete(path, true);
			}
		}
		#endregion
		protected void AddNewFolder(string name)
		{
			name = Path.Combine(_rootPath, name);
			if (Directory.Exists(name))
			{
				throw new Exception("Tên thư mục đã tồn tại.");
			}
			else
			{
				Directory.CreateDirectory(name);
			}
		}
	}

	public class FMResponse
	{
		public bool Success { get; set; } = true;
		public string? Message { get; set; }
		public object? Data { get; set; }
	}

	public class FMFolderItem
	{
		public string Path { get; set; }
		public string Name { get; set; }
		public bool IsFolder { get; set; }
    }
}
