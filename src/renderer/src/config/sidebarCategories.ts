import { 
  User, CheckSquare, Folder, BoxSelect, Users,
  GitBranch, Play, Repeat, Timer, Octagon,
  Globe, Database, FileText, Bell, Bot,
  BarChart2, Calculator,
  StickyNote, Tag, ShieldCheck, Settings
} from 'lucide-react';

export const getSidebarCategories = (t: (key: string) => string) => [
  {
    title: t('organization'),
    items: [
      { type: 'member', icon: User, label: 'Member', color: 'text-blue-500 dark:text-blue-400', border: 'hover:border-blue-300 dark:hover:border-blue-500/50', 
        desc: { vi: 'Đại diện cho một nhân sự trong nhóm.', en: 'Represents a single team member.' }, 
        ex: { vi: 'Nguyễn Văn A - Team Frontend.', en: 'John Doe - Frontend Team.' } },
      { type: 'task', icon: CheckSquare, label: 'Task', color: 'text-emerald-500 dark:text-emerald-400', border: 'hover:border-emerald-300 dark:hover:border-emerald-500/50', 
        desc: { vi: 'Đại diện cho một công việc cần thực hiện.', en: 'Represents a specific task to be completed.' }, 
        ex: { vi: 'Thiết kế giao diện (Deadline 25/12).', en: 'Design UI (Deadline Dec 25).' } },
      { type: 'project', icon: Folder, label: 'Project', color: 'text-purple-500 dark:text-purple-400', border: 'hover:border-purple-300 dark:hover:border-purple-500/50', 
        desc: { vi: 'Nhóm nhiều Task lại thành dự án lớn.', en: 'Groups multiple tasks into a large project.' }, 
        ex: { vi: 'Dự án phát triển Hệ thống T-Base.', en: 'T-Base System Development Project.' } },
      { type: 'group', icon: BoxSelect, label: 'Group Area', color: 'text-gray-500 dark:text-gray-400', border: 'hover:border-gray-400 dark:hover:border-gray-500/50', 
        desc: { vi: 'Vùng trong suốt gom nhóm trực quan các node lại với nhau.', en: 'Transparent area to visually group nodes together.' }, 
        ex: { vi: 'Kéo các Task backend ném vào Group Backend để tự động neo lại.', en: 'Drag backend tasks into Backend Group to automatically dock them.' } },
      { type: 'team', icon: Users, label: 'Team', color: 'text-indigo-500 dark:text-indigo-400', border: 'hover:border-indigo-300 dark:hover:border-indigo-500/50', 
        desc: { vi: 'Tập hợp nhiều Member cùng làm việc chung.', en: 'A collection of members working together.' }, 
        ex: { vi: 'Đội Marketing Team gồm 5 người.', en: 'Marketing Team consisting of 5 people.' } },
    ]
  },
  {
    title: t('flow_logic'),
    items: [
      { type: 'trigger', icon: Play, label: 'Trigger', color: 'text-orange-500', border: 'hover:border-orange-300 dark:hover:border-orange-500/50', 
        desc: { vi: 'Cơ chế kích hoạt đầu vào của quy trình.', en: 'Input activation mechanism for the workflow.' }, 
        ex: { vi: 'Manual (Bấm tay), Cron Schedule (Lên lịch đều đặn).', en: 'Manual trigger or Cron Schedule.' } },
      { type: 'decision', icon: GitBranch, label: 'Decision', color: 'text-yellow-600 dark:text-yellow-500', border: 'hover:border-yellow-400 dark:hover:border-yellow-500/50', 
        desc: { vi: 'Rẽ nhánh điều kiện logic.', en: 'Logical condition branching.' }, 
        ex: { vi: 'Nếu tổng đơn > 50$ thì rẽ qua dây Xanh (True), ngược lại dây Đỏ (False).', en: 'If total > $50 route to Green (True), else Red (False).' } },
      { type: 'loop', icon: Repeat, label: 'Loop', color: 'text-blue-500', border: 'hover:border-blue-300 dark:hover:border-blue-500/50', 
        desc: { vi: 'Lặp lại một tập hợp tác vụ cụ thể.', en: 'Repeats a specific set of tasks.' }, 
        ex: { vi: 'Vòng lặp gửi email nội bộ giới hạn Max: 10 lần.', en: 'Loop to send internal emails max 10 times.' } },
      { type: 'delay', icon: Timer, label: 'Delay', color: 'text-amber-600 dark:text-amber-500', border: 'hover:border-amber-400 dark:hover:border-amber-500/50', 
        desc: { vi: 'Tạm dừng toàn bộ quy trình chờ thời gian.', en: 'Pauses the workflow for a specific duration.' }, 
        ex: { vi: 'Tạm chờ 5 phút trước khi nhắc nhở lại.', en: 'Wait 5 minutes before reminding again.' } },
      { type: 'exit', icon: Octagon, label: 'Exit', color: 'text-red-500', border: 'hover:border-red-300 dark:hover:border-red-500/50', 
        desc: { vi: 'Điểm kết thúc hủy Flow.', en: 'Termination point to cancel the flow.' }, 
        ex: { vi: 'Nếu lỗi 403, thoát ra để dừng quy trình.', en: 'If 403 error occurs, exit to stop the workflow.' } },
    ]
  },
  {
    title: t('integration'),
    items: [
      { type: 'api', icon: Globe, label: 'API Request', color: 'text-cyan-500 dark:text-cyan-400', border: 'hover:border-cyan-300 dark:hover:border-cyan-500/50', 
        desc: { vi: 'Gọi yêu cầu HTTP đến máy chủ web khác.', en: 'Makes an HTTP request to an external server.' }, 
        ex: { vi: 'Gửi GET HTTP lên lấy tỉ giá Bitcoin.', en: 'Send HTTP GET to fetch Bitcoin exchange rate.' } },
      { type: 'database', icon: Database, label: 'Database', color: 'text-pink-500 dark:text-pink-400', border: 'hover:border-pink-300 dark:hover:border-pink-500/50', 
        desc: { vi: 'Thực thi SQL trực tiếp.', en: 'Executes SQL commands directly.' }, 
        ex: { vi: 'UPDATE trang_thai="DaXong" WHERE user_id=1.', en: 'UPDATE status="Done" WHERE user_id=1.' } },
      { type: 'file', icon: FileText, label: 'File Op', color: 'text-teal-500 dark:text-teal-400', border: 'hover:border-teal-300 dark:hover:border-teal-500/50', 
        desc: { vi: 'Đọc, ghi hoặc chỉnh sửa File nội bộ.', en: 'Read, write, or modify internal files.' }, 
        ex: { vi: 'Ghi log vào /tmp/error.log.', en: 'Write log to /tmp/error.log.' } },
      { type: 'notification', icon: Bell, label: 'Notification', color: 'text-yellow-600 dark:text-yellow-400', border: 'hover:border-yellow-400 dark:hover:border-yellow-400/50', 
        desc: { vi: 'Bắn thông báo qua ứng dụng tin nhắn.', en: 'Sends a notification via messaging app.' }, 
        ex: { vi: 'Báo email về có đơn hàng 100$.', en: 'Email alert for a new $100 order.' } },
      { type: 'ai', icon: Bot, label: 'AI Task', color: 'text-fuchsia-500 dark:text-fuchsia-400', border: 'hover:border-fuchsia-300 dark:hover:border-fuchsia-500/50', 
        desc: { vi: 'Sử dụng mô hình AI xử lý.', en: 'Uses an AI model for processing.' }, 
        ex: { vi: 'Summarize file nội dung 10 trang ra 5 dòng dùng model gpt-4.', en: 'Summarize a 10-page document into 5 lines using GPT-4.' } },
    ]
  },
  {
    title: t('analytics'),
    items: [
      { type: 'progress', icon: BarChart2, label: 'Progress', color: 'text-emerald-500 dark:text-emerald-400', border: 'hover:border-emerald-300 dark:hover:border-emerald-500/50', 
        desc: { vi: 'Đồng hồ thanh trạng thái định lượng.', en: 'Quantitative status progress bar.' }, 
        ex: { vi: 'Track tổng thể 80% project để báo cáo tiến độ tuần.', en: 'Track overall 80% project progress for weekly report.' } },
      { type: 'calculation', icon: Calculator, label: 'Calculate', color: 'text-blue-500 dark:text-blue-400', border: 'hover:border-blue-300 dark:hover:border-blue-500/50', 
        desc: { vi: 'Toán học và logic đa luồng.', en: 'Mathematical calculations and logic.' }, 
        ex: { vi: 'Tính (DoanhThu + GiamGia) / SoThang.', en: 'Calculate (Revenue + Discount) / Months.' } },
    ]
  },
  {
    title: t('meta_utils'),
    items: [
      { type: 'note', icon: StickyNote, label: 'Note', color: 'text-yellow-500 dark:text-yellow-200', border: 'hover:border-yellow-400 dark:hover:border-yellow-400/50', 
        desc: { vi: 'Giấy ghi chú dán trực tiếp lên canvas.', en: 'Sticky note plastered directly onto the canvas.' }, 
        ex: { vi: 'Ghi "Phần màu đỏ cần review lại".', en: 'Note "The red part needs to be reviewed again".' } },
      { type: 'label', icon: Tag, label: 'Label', color: 'text-gray-500 dark:text-gray-300', border: 'hover:border-gray-300 dark:hover:border-gray-400/50', 
        desc: { vi: 'Chữ trong suốt định nghĩa khu vực to.', en: 'Transparent text to define a large area.' }, 
        ex: { vi: 'Viết text KHU VỰC THỬ NGHIỆM ĐỂ XÓA.', en: 'Write TESTING AREA TO DELETE.' } },
      { type: 'permission', icon: ShieldCheck, label: 'Permission', color: 'text-rose-500 dark:text-rose-400', border: 'hover:border-rose-300 dark:hover:border-rose-500/50', 
        desc: { vi: 'Xác thực Role nhóm đi qua.', en: 'Authenticates required user roles to proceed.' }, 
        ex: { vi: 'Cần Role là "Manager" mới được đi ngang.', en: 'Requires "Manager" role to pass.' } },
      { type: 'config', icon: Settings, label: 'Config', color: 'text-slate-500 dark:text-slate-400', border: 'hover:border-slate-300 dark:hover:border-slate-500/50', 
        desc: { vi: 'Cọc cắm chứa Cấu hình môi trường.', en: 'Node to store environment configurations.' }, 
        ex: { vi: 'Lưu mã SECRET_KEY an toàn.', en: 'Securely store a SECRET_KEY.' } },
    ]
  }
];
