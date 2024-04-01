using Microsoft.AspNetCore.Mvc;
using QTExplorer.Common;

namespace QTExplorer.Controllers
{
    [ApiController]
    [Route("filemanager")]
    public class FileManagerController : Controller
    {
        FileManager _fm;

        public IActionResult ExecuteCmd([FromServices] IWebHostEnvironment env)
        {
            // lấy đường dẫn thư mục wwwroot
            var wwwroot = env.WebRootPath;
            // nối chuỗi để có đường dẫn thư mục upload
            var uploadPath = Path.Combine(wwwroot, "upload");
            _fm = new FileManager(uploadPath, Request);

            return Ok(_fm.ExecuteCmd());
        }
    }
}
