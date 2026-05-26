import { useRef, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  Camera,
  Check,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  CreditCard,
  Fingerprint,
  GalleryHorizontalEnd,
  Image,
  Layers3,
  LockKeyhole,
  MapPin,
  MessageCircle,
  Radar,
  ShieldCheck,
  Sparkles,
  Star,
  UserCheck,
  WandSparkles,
  WalletCards,
  Zap,
} from "lucide-react";
import {
  AnimatePresence,
  motion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";

const ease = [0.22, 1, 0.36, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.72, ease } },
};

const stagger = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.08,
    },
  },
};

const iconProps = { strokeWidth: 1.5 };

const landingCopy = {
  en: {
    dashboard: {
      label: "PhotoHub Command Center",
      secured: "Secured",
      shortlistEyebrow: "AI shortlist",
      shortlistTitle: "18 verified creators",
      shoots: [
        ["Editorial portrait", "Ho Chi Minh", "94% match", "cyan"],
        ["Wedding ceremony", "Da Nang", "Escrow held", "violet"],
        ["Product launch", "District 1", "Final review", "silver"],
      ],
      balance: "Escrow balance",
      gallery: "Live gallery approval",
      stages: ["RAW sync", "Watermark", "Client picks"],
      stageLabel: "Stage",
      metrics: [
        ["Booked value", "$48k", CircleDollarSign],
        ["Trust score", "98.4", Fingerprint],
        ["Avg reply", "7 min", Clock3],
      ],
    },
    hero: {
      eyebrow: "Escrow-first photography marketplace",
      titleLead: "Frames captured.",
      titleAccent: "Trust secured.",
      copy:
        "PhotoHub matches clients with verified photographers, protects every transaction with escrow, and turns creative booking into a calm, premium workflow.",
      primary: "Start secure booking",
      secondary: "Explore creators",
    },
    friction: {
      eyebrow: "Market friction",
      title: "The best shoots should not begin with doubt.",
      copy:
        "PhotoHub compresses the messy trust gap between clients and photographers into visible proof, protected money, and precise matching.",
      painPoints: [
        {
          title: "Clients hesitate",
          intro:
            "Unknown quality, vague pricing, and fear of paying before seeing proof.",
          points: ["Fake portfolios", "Hidden fees", "No delivery leverage"],
          tone: "from-rose-500/40 to-amber-400/10",
        },
        {
          title: "Photographers get exposed",
          intro:
            "Great work still gets trapped behind unstable demand and risky deposits.",
          points: ["Ghosted after bidding", "Late payments", "No verified demand"],
          tone: "from-amber-400/35 to-rose-500/10",
        },
      ],
    },
    ecosystem: {
      eyebrow: "PhotoHub ecosystem",
      title: "A marketplace that behaves like a command center.",
      copy:
        "Discovery, bidding, reputation, and AI matching live in one calm surface designed for high-trust creative decisions.",
      items: [
        {
          icon: GalleryHorizontalEnd,
          title: "Portfolio Intelligence",
          copy:
            "Curated galleries, style tags, shoot history, and live availability in one decision layer.",
          meta: "4.9 median rating",
        },
        {
          icon: Layers3,
          title: "Bidding Rooms",
          copy:
            "Clients post a brief, photographers send clear offers, and every term is recorded before work starts.",
          meta: "42 sec brief builder",
        },
        {
          icon: BadgeCheck,
          title: "Verified Reviews",
          copy:
            "Only completed bookings can review, keeping trust signals clean and useful for both sides.",
          meta: "Escrow-backed proof",
        },
        {
          icon: MessageCircle,
          title: "Deal Chat",
          copy:
            "Timeline, shot list, references, and delivery notes stay attached to the booking.",
          meta: "No lost context",
        },
      ],
      ai: {
        eyebrow: "AI recommendation",
        title: "Local fit and visual style, scored in real time.",
        copy:
          "The recommendation engine reads brief intent, city distance, portfolio tone, rating integrity, and delivery behavior before presenting the strongest match.",
        match: "96% match",
        brief: "Editorial portrait",
        signals: ["Local", "Style", "Budget", "Trust"],
      },
    },
    security: {
      eyebrow: "Ironclad security",
      title: "Escrow protection is the center of the experience.",
      copy:
        "Clients gain confidence before paying. Photographers know approved work will be paid. PhotoHub holds the middle with a transparent release protocol.",
      flow: [
        { title: "Client funds", icon: CreditCard, copy: "Deposit enters a protected transaction." },
        { title: "PhotoHub vault", icon: LockKeyhole, copy: "Funds stay locked until delivery terms are met." },
        { title: "Gallery delivered", icon: Image, copy: "Files, selections, and revisions are tracked." },
        { title: "Payout released", icon: Banknote, copy: "Photographer receives clean settlement." },
      ],
    },
    workflow: {
      eyebrow: "Seamless workflow",
      title: "A shoot journey that stays beautifully controlled.",
      copy:
        "Every step is visible, timestamped, and connected to the same protected booking.",
      stepLabel: "Step",
      steps: [
        {
          title: "Build the brief",
          copy:
            "Choose location, mood, date, budget, and references. PhotoHub turns it into a clean shoot request.",
          icon: WandSparkles,
        },
        {
          title: "Match and compare",
          copy:
            "AI ranks verified photographers by local fit, style proximity, response speed, and trust score.",
          icon: Radar,
        },
        {
          title: "Lock with escrow",
          copy: "Payment is held by PhotoHub until the agreed deliverables are confirmed.",
          icon: ShieldCheck,
        },
        {
          title: "Deliver and release",
          copy:
            "Files, revisions, and approval status are tracked before funds are released to the photographer.",
          icon: Image,
        },
      ],
    },
    social: {
      eyebrow: "Social proof",
      title: "Trust is visible before the first message.",
      copy:
        "Verified reviews, protected bookings, and real visual outcomes move buyers and creators into the same confident rhythm.",
      testimonials: [
        {
          name: "Maya Tran",
          role: "Wedding client",
          quote:
            "The escrow flow made booking a destination photographer feel completely calm.",
          image:
            "https://images.unsplash.com/photo-1529634597503-139d3726fed5?auto=format&fit=crop&q=80&w=400",
        },
        {
          name: "Kenji R.",
          role: "Commercial photographer",
          quote: "I spend less time chasing deposits and more time closing premium shoots.",
          image:
            "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400",
        },
        {
          name: "Linh Dao",
          role: "Brand manager",
          quote:
            "The recommendations were sharp. We found the exact editorial look in one afternoon.",
          image:
            "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400",
        },
        {
          name: "Arun Malik",
          role: "Portrait artist",
          quote:
            "Transparent terms changed the whole tone of negotiation with new clients.",
          image:
            "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400",
        },
        {
          name: "Sofia Nguyen",
          role: "Fashion founder",
          quote:
            "Every shortlist felt premium, local, and genuinely aligned with our campaign.",
          image:
            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400",
        },
        {
          name: "Noah Park",
          role: "Event producer",
          quote: "Fast bids, visible protection, and no awkward payment uncertainty.",
          image:
            "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=400",
        },
      ],
    },
    pricing: {
      eyebrow: "Transparent economy",
      title: "The money story is clear on both sides.",
      copy:
        "Clients see what they pay for. Photographers understand why the commission exists and what it protects.",
      tabs: { client: "Client", photographer: "Photographer" },
      content: {
        client: {
          eyebrow: "For clients",
          title: "0% hidden fees",
          copy:
            "Transparent booking totals, escrow protection, verified creator profiles, and clear revision terms before you commit.",
          stats: ["Escrow included", "No surprise checkout", "Verified portfolios"],
          icon: UserCheck,
        },
        photographer: {
          eyebrow: "For photographers",
          title: "Fair commission",
          copy:
            "A premium marketplace fee funds discovery, payment protection, dispute support, portfolio tools, and qualified client demand.",
          stats: ["Protected payout", "Qualified leads", "Smart portfolio tools"],
          icon: WalletCards,
        },
      },
    },
    finalCta: {
      title: "Book the shoot. Protect the trust.",
      copy:
        "PhotoHub gives premium photographers and serious clients one secure place to find, agree, deliver, and pay.",
      button: "Enter PhotoHub",
    },
  },
  vi: {
    dashboard: {
      label: "Bảng điều khiển PhotoHub",
      secured: "Đã bảo vệ",
      shortlistEyebrow: "Danh sách AI",
      shortlistTitle: "18 creator đã xác thực",
      shoots: [
        ["Chân dung editorial", "TP. Hồ Chí Minh", "Khớp 94%", "cyan"],
        ["Lễ cưới", "Đà Nẵng", "Đã giữ ký quỹ", "violet"],
        ["Ra mắt sản phẩm", "Quận 1", "Duyệt cuối", "silver"],
      ],
      balance: "Số dư ký quỹ",
      gallery: "Duyệt gallery trực tiếp",
      stages: ["Đồng bộ RAW", "Watermark", "Khách chọn ảnh"],
      stageLabel: "Bước",
      metrics: [
        ["Giá trị đã đặt", "$48k", CircleDollarSign],
        ["Điểm tin cậy", "98.4", Fingerprint],
        ["Phản hồi TB", "7 phút", Clock3],
      ],
    },
    hero: {
      eyebrow: "Marketplace nhiếp ảnh ưu tiên ký quỹ",
      titleLead: "Ghi lại khoảnh khắc.",
      titleAccent: "Bảo vệ niềm tin.",
      copy:
        "PhotoHub ghép khách hàng với nhiếp ảnh gia đã xác thực, bảo vệ giao dịch bằng ký quỹ và biến việc đặt lịch sáng tạo thành một quy trình cao cấp, yên tâm.",
      primary: "Đặt lịch an toàn",
      secondary: "Khám phá creator",
    },
    friction: {
      eyebrow: "Nút thắt thị trường",
      title: "Một buổi chụp tốt không nên bắt đầu bằng sự nghi ngờ.",
      copy:
        "PhotoHub rút ngắn khoảng cách niềm tin giữa khách hàng và nhiếp ảnh gia bằng bằng chứng rõ ràng, dòng tiền được bảo vệ và ghép cặp chính xác.",
      painPoints: [
        {
          title: "Khách hàng còn do dự",
          intro:
            "Chất lượng khó kiểm chứng, giá thiếu rõ ràng và nỗi sợ trả tiền trước khi thấy kết quả.",
          points: ["Portfolio giả", "Phí ẩn", "Khó bảo đảm giao ảnh"],
          tone: "from-rose-500/40 to-amber-400/10",
        },
        {
          title: "Nhiếp ảnh gia dễ gặp rủi ro",
          intro:
            "Tay nghề tốt vẫn bị kẹt giữa nhu cầu bấp bênh và đặt cọc thiếu an toàn.",
          points: ["Bị biến mất sau báo giá", "Thanh toán trễ", "Ít khách đã xác thực"],
          tone: "from-amber-400/35 to-rose-500/10",
        },
      ],
    },
    ecosystem: {
      eyebrow: "Hệ sinh thái PhotoHub",
      title: "Một marketplace vận hành như trung tâm điều phối.",
      copy:
        "Khám phá, đấu thầu, uy tín và ghép cặp AI nằm trên cùng một bề mặt rõ ràng cho các quyết định sáng tạo cần độ tin cậy cao.",
      items: [
        {
          icon: GalleryHorizontalEnd,
          title: "Trí tuệ Portfolio",
          copy:
            "Gallery chọn lọc, tag phong cách, lịch sử buổi chụp và lịch trống trực tiếp trong một lớp quyết định.",
          meta: "Rating trung vị 4.9",
        },
        {
          icon: Layers3,
          title: "Phòng báo giá",
          copy:
            "Khách đăng brief, nhiếp ảnh gia gửi đề xuất rõ ràng, mọi điều khoản được ghi nhận trước khi bắt đầu.",
          meta: "Tạo brief trong 42 giây",
        },
        {
          icon: BadgeCheck,
          title: "Đánh giá xác thực",
          copy:
            "Chỉ booking hoàn tất mới được đánh giá, giữ tín hiệu tin cậy sạch và hữu ích cho cả hai phía.",
          meta: "Bằng chứng có ký quỹ",
        },
        {
          icon: MessageCircle,
          title: "Chat chốt deal",
          copy:
            "Timeline, shot list, ảnh tham chiếu và ghi chú giao ảnh luôn gắn với booking.",
          meta: "Không mất ngữ cảnh",
        },
      ],
      ai: {
        eyebrow: "Gợi ý bằng AI",
        title: "Chấm điểm độ phù hợp địa phương và phong cách theo thời gian thực.",
        copy:
          "Bộ máy gợi ý đọc mục tiêu brief, khoảng cách thành phố, màu portfolio, độ tin cậy rating và hành vi giao ảnh trước khi đưa ra lựa chọn mạnh nhất.",
        match: "Khớp 96%",
        brief: "Chân dung editorial",
        signals: ["Địa phương", "Phong cách", "Ngân sách", "Niềm tin"],
      },
    },
    security: {
      eyebrow: "Bảo mật chắc chắn",
      title: "Ký quỹ là trung tâm của trải nghiệm.",
      copy:
        "Khách hàng tự tin trước khi thanh toán. Nhiếp ảnh gia biết công việc được duyệt sẽ được trả tiền. PhotoHub đứng giữa với giao thức giải ngân minh bạch.",
      flow: [
        { title: "Khách thanh toán", icon: CreditCard, copy: "Tiền cọc đi vào giao dịch được bảo vệ." },
        { title: "Két PhotoHub", icon: LockKeyhole, copy: "Tiền được giữ cho đến khi điều khoản giao ảnh hoàn tất." },
        { title: "Gallery đã giao", icon: Image, copy: "File, lựa chọn ảnh và chỉnh sửa đều được theo dõi." },
        { title: "Giải ngân", icon: Banknote, copy: "Nhiếp ảnh gia nhận khoản thanh toán rõ ràng." },
      ],
    },
    workflow: {
      eyebrow: "Quy trình liền mạch",
      title: "Hành trình buổi chụp được kiểm soát đẹp mắt.",
      copy:
        "Mỗi bước đều hiển thị rõ, có mốc thời gian và gắn với cùng một booking được bảo vệ.",
      stepLabel: "Bước",
      steps: [
        {
          title: "Tạo brief",
          copy:
            "Chọn địa điểm, mood, ngày, ngân sách và ảnh tham chiếu. PhotoHub biến nó thành yêu cầu chụp rõ ràng.",
          icon: WandSparkles,
        },
        {
          title: "Ghép cặp và so sánh",
          copy:
            "AI xếp hạng nhiếp ảnh gia đã xác thực theo độ phù hợp địa phương, phong cách, tốc độ phản hồi và điểm tin cậy.",
          icon: Radar,
        },
        {
          title: "Khóa bằng ký quỹ",
          copy: "Thanh toán được PhotoHub giữ cho đến khi deliverable đã thỏa thuận được xác nhận.",
          icon: ShieldCheck,
        },
        {
          title: "Giao ảnh và giải ngân",
          copy:
            "File, chỉnh sửa và trạng thái duyệt được theo dõi trước khi tiền được giải ngân.",
          icon: Image,
        },
      ],
    },
    social: {
      eyebrow: "Minh chứng niềm tin",
      title: "Niềm tin hiện rõ trước tin nhắn đầu tiên.",
      copy:
        "Đánh giá xác thực, booking được bảo vệ và kết quả hình ảnh thật giúp khách hàng và creator bước vào cùng một nhịp tự tin.",
      testimonials: [
        {
          name: "Maya Tran",
          role: "Khách hàng cưới",
          quote:
            "Luồng ký quỹ khiến việc đặt nhiếp ảnh gia đi tỉnh trở nên rất yên tâm.",
          image:
            "https://images.unsplash.com/photo-1529634597503-139d3726fed5?auto=format&fit=crop&q=80&w=400",
        },
        {
          name: "Kenji R.",
          role: "Nhiếp ảnh gia thương mại",
          quote: "Tôi ít phải đuổi theo tiền cọc hơn và có thêm thời gian chốt job cao cấp.",
          image:
            "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400",
        },
        {
          name: "Linh Dao",
          role: "Brand manager",
          quote:
            "Gợi ý rất sắc. Chúng tôi tìm được đúng chất editorial chỉ trong một buổi chiều.",
          image:
            "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400",
        },
        {
          name: "Arun Malik",
          role: "Nghệ sĩ chân dung",
          quote:
            "Điều khoản minh bạch làm cuộc thương lượng với khách mới dễ chịu hơn hẳn.",
          image:
            "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400",
        },
        {
          name: "Sofia Nguyen",
          role: "Nhà sáng lập thời trang",
          quote:
            "Mỗi shortlist đều cao cấp, đúng địa phương và thật sự khớp với chiến dịch.",
          image:
            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400",
        },
        {
          name: "Noah Park",
          role: "Nhà sản xuất sự kiện",
          quote: "Báo giá nhanh, bảo vệ rõ ràng và không còn lấn cấn chuyện thanh toán.",
          image:
            "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=400",
        },
      ],
    },
    pricing: {
      eyebrow: "Kinh tế minh bạch",
      title: "Câu chuyện tiền bạc rõ ràng cho cả hai phía.",
      copy:
        "Khách hàng thấy mình trả cho điều gì. Nhiếp ảnh gia hiểu hoa hồng tồn tại để bảo vệ điều gì.",
      tabs: { client: "Khách hàng", photographer: "Nhiếp ảnh gia" },
      content: {
        client: {
          eyebrow: "Cho khách hàng",
          title: "0% phí ẩn",
          copy:
            "Tổng tiền minh bạch, bảo vệ ký quỹ, hồ sơ creator đã xác thực và điều khoản chỉnh sửa rõ trước khi cam kết.",
          stats: ["Đã gồm ký quỹ", "Không bất ngờ ở checkout", "Portfolio đã xác thực"],
          icon: UserCheck,
        },
        photographer: {
          eyebrow: "Cho nhiếp ảnh gia",
          title: "Hoa hồng xứng đáng",
          copy:
            "Phí marketplace cao cấp tài trợ discovery, bảo vệ thanh toán, hỗ trợ tranh chấp, công cụ portfolio và nguồn khách chất lượng.",
          stats: ["Thanh toán được bảo vệ", "Lead chất lượng", "Công cụ portfolio thông minh"],
          icon: WalletCards,
        },
      },
    },
    finalCta: {
      title: "Đặt buổi chụp. Bảo vệ niềm tin.",
      copy:
        "PhotoHub cho nhiếp ảnh gia cao cấp và khách hàng nghiêm túc một nơi an toàn để tìm nhau, thỏa thuận, giao ảnh và thanh toán.",
      button: "Vào PhotoHub",
    },
  },
};

function SectionIntro({ eyebrow, title, copy, align = "center" }) {
  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-120px" }}
      className={
        align === "left"
          ? "mx-auto mb-12 max-w-3xl"
          : "mx-auto mb-12 max-w-3xl text-center"
      }
    >
      <motion.div
        variants={fadeUp}
        className={
          align === "left"
            ? "mb-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200/80"
            : "mb-4 inline-flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200/80"
        }
      >
        <Sparkles className="h-4 w-4" {...iconProps} />
        {eyebrow}
      </motion.div>
      <motion.h2
        variants={fadeUp}
        className="text-3xl font-semibold tracking-tight text-white sm:text-5xl"
      >
        {title}
      </motion.h2>
      <motion.p
        variants={fadeUp}
        className="mt-5 text-base leading-8 text-slate-300 sm:text-lg"
      >
        {copy}
      </motion.p>
    </motion.div>
  );
}

function GradientButton({ children, className = "" }) {
  return (
    <button
      className={`group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full border border-white/10 bg-white px-5 py-3 text-sm font-semibold text-slate-950 shadow-[0_0_50px_rgba(34,211,238,0.18)] transition-all duration-500 hover:-translate-y-0.5 hover:shadow-[0_0_70px_rgba(139,92,246,0.35)] ${className}`}
    >
      <span className="absolute inset-0 translate-x-[-120%] bg-gradient-to-r from-transparent via-cyan-200/60 to-transparent transition-transform duration-700 group-hover:translate-x-[120%]" />
      <span className="relative flex items-center gap-2">
        {children}
        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" {...iconProps} />
      </span>
    </button>
  );
}

function GhostButton({ children }) {
  return (
    <button className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white backdrop-blur-md transition-all duration-500 hover:border-cyan-300/40 hover:bg-white/[0.08]">
      {children}
      <ChevronRight className="h-4 w-4" {...iconProps} />
    </button>
  );
}

function DashboardMockup({ copy, scale, y, opacity }) {
  return (
    <motion.div
      style={{ scale, y, opacity }}
      className="relative mx-auto mt-12 w-full max-w-6xl origin-top"
    >
      <div className="absolute -inset-x-8 top-8 h-px bg-gradient-to-r from-transparent via-cyan-300/50 to-transparent" />
      <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/65 shadow-[0_40px_160px_rgba(0,0,0,0.75)] backdrop-blur-md">
        <div className="theme-dashboard-aura absolute inset-0 bg-[linear-gradient(120deg,rgba(139,92,246,0.18),transparent_30%,rgba(34,211,238,0.14)_70%,transparent)]" />
        <div className="relative border-b border-white/10 px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-rose-400/70" />
              <span className="h-3 w-3 rounded-full bg-amber-300/70" />
              <span className="h-3 w-3 rounded-full bg-cyan-300/70" />
            </div>
            <div className="hidden rounded-full border border-white/10 bg-black/25 px-4 py-1.5 text-xs text-slate-300 sm:block">
              {copy.label}
            </div>
            <div className="flex items-center gap-2 text-xs text-cyan-200">
              <LockKeyhole className="h-4 w-4" {...iconProps} />
              {copy.secured}
            </div>
          </div>
        </div>

        <div className="relative grid gap-4 p-4 md:grid-cols-[0.72fr_1.28fr] md:p-6">
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
                    {copy.shortlistEyebrow}
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-white">
                    {copy.shortlistTitle}
                  </h3>
                </div>
                <div className="rounded-full border border-cyan-300/20 bg-cyan-300/10 p-3 text-cyan-200">
                  <Radar className="h-5 w-5" {...iconProps} />
                </div>
              </div>
              <div className="space-y-3">
                {copy.shoots.map(([name, place, status, color]) => (
                  <div
                    key={name}
                    className="grid grid-cols-[1fr_auto] gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-white">{name}</p>
                      <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                        <MapPin className="h-3.5 w-3.5" {...iconProps} />
                        {place}
                      </p>
                    </div>
                    <span
                      className={`self-start rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                        color === "cyan"
                          ? "bg-cyan-300/10 text-cyan-200"
                          : color === "violet"
                            ? "bg-violet-400/10 text-violet-200"
                            : "bg-slate-200/10 text-slate-200"
                      }`}
                    >
                      {status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-medium text-slate-300">{copy.balance}</p>
                <ShieldCheck className="h-5 w-5 text-cyan-200" {...iconProps} />
              </div>
              <p className="text-3xl font-semibold tracking-tight text-white">
                $12,840
              </p>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-[72%] rounded-full bg-gradient-to-r from-violet-500 via-slate-200 to-cyan-300" />
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-rows-[1fr_auto]">
            <div className="relative min-h-[310px] overflow-hidden rounded-2xl border border-white/10 bg-black/35">
              <img
                src="https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=1400"
                alt="Wedding photography review"
                className="absolute inset-0 h-full w-full object-cover opacity-65 mix-blend-luminosity"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-black via-slate-950/40 to-transparent" />
              <div className="absolute left-5 top-5 rounded-full border border-white/10 bg-black/35 px-3 py-1 text-xs font-medium text-white backdrop-blur-md">
                {copy.gallery}
              </div>
              <div className="absolute bottom-5 left-5 right-5 grid gap-3 sm:grid-cols-3">
                {copy.stages.map((item, index) => (
                  <div
                    key={item}
                    className="rounded-xl border border-white/10 bg-slate-950/55 p-3 backdrop-blur-md"
                  >
                    <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
                      {copy.stageLabel} 0{index + 1}
                    </p>
                    <p className="mt-1 text-sm font-medium text-white">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {[
                ...copy.metrics,
              ].map(([label, value, Icon]) => (
                <div
                  key={label}
                  className="rounded-2xl border border-white/10 bg-white/[0.035] p-4"
                >
                  <Icon className="mb-4 h-5 w-5 text-cyan-200" {...iconProps} />
                  <p className="text-2xl font-semibold text-white">{value}</p>
                  <p className="mt-1 text-xs text-slate-400">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function HeroImageAtmosphere() {
  const images = [
    "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=85&w=1400",
    "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=85&w=1100",
    "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&q=85&w=1100",
  ];

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <img
        src={images[0]}
        alt=""
        className="hero-backdrop-photo absolute inset-0 h-full w-full object-cover"
      />
      <div className="hero-photo-frame hero-photo-frame-left absolute left-4 top-44 hidden h-72 w-52 rotate-[-7deg] overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.04] shadow-[0_30px_90px_rgba(15,23,42,0.22)] backdrop-blur-md md:block lg:left-12 lg:h-80 lg:w-60">
        <img src={images[1]} alt="" className="h-full w-full object-cover" />
      </div>
      <div className="hero-photo-frame hero-photo-frame-right absolute right-4 top-36 hidden h-80 w-56 rotate-[6deg] overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.04] shadow-[0_30px_90px_rgba(15,23,42,0.2)] backdrop-blur-md md:block lg:right-12 lg:h-96 lg:w-64">
        <img src={images[2]} alt="" className="h-full w-full object-cover" />
      </div>
    </div>
  );
}

function HeroSection({ copy }) {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 28,
    mass: 0.3,
  });
  const dashboardScale = useTransform(smoothProgress, [0, 0.85], [0.82, 1.08]);
  const dashboardY = useTransform(smoothProgress, [0, 0.85], [44, -36]);
  const dashboardOpacity = useTransform(smoothProgress, [0, 0.08, 0.9], [0.75, 1, 1]);

  return (
    <section
      ref={heroRef}
      className="relative min-h-[145vh] overflow-hidden bg-black px-4 pt-28 sm:px-6 lg:px-8"
    >
      <div className="theme-hero-aura absolute inset-0 bg-[radial-gradient(circle_at_50%_-15%,rgba(139,92,246,0.22),transparent_36%),linear-gradient(180deg,rgba(2,6,23,0)_0%,#020617_82%)]" />
      <HeroImageAtmosphere />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/50 to-transparent" />
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="relative z-10 mx-auto max-w-7xl text-center"
      >
        <motion.div
          variants={fadeUp}
          className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-medium uppercase tracking-[0.22em] text-slate-300 backdrop-blur-md"
        >
          <ShieldCheck className="h-4 w-4 text-cyan-200" {...iconProps} />
          {copy.eyebrow}
        </motion.div>
        <motion.h1
          variants={fadeUp}
          className="mx-auto max-w-5xl text-5xl font-semibold leading-[0.98] tracking-tight text-white sm:text-7xl lg:text-8xl"
        >
          {copy.titleLead}{" "}
          <span className="hero-title-accent bg-gradient-to-r from-violet-400 via-slate-100 to-cyan-300 bg-clip-text text-transparent">
            {copy.titleAccent}
          </span>
        </motion.h1>
        <motion.p
          variants={fadeUp}
          className="mx-auto mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg"
        >
          {copy.copy}
        </motion.p>
        <motion.div
          variants={fadeUp}
          className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <GradientButton>{copy.primary}</GradientButton>
          <GhostButton>
            <Camera className="h-4 w-4" {...iconProps} />
            {copy.secondary}
          </GhostButton>
        </motion.div>
      </motion.div>

      <div className="sticky top-20 z-10 mx-auto max-w-7xl pb-28">
        <DashboardMockup
          copy={copy.dashboard}
          scale={dashboardScale}
          y={dashboardY}
          opacity={dashboardOpacity}
        />
      </div>
    </section>
  );
}

function FrictionSection({ copy }) {
  return (
    <section className="relative bg-slate-950 px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionIntro
          eyebrow={copy.eyebrow}
          title={copy.title}
          copy={copy.copy}
        />

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-120px" }}
          className="grid gap-5 md:grid-cols-2"
        >
          {copy.painPoints.map((item) => (
            <motion.div
              key={item.title}
              variants={fadeUp}
              className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] p-6 backdrop-blur-md transition-all duration-500 hover:border-white/20 sm:p-8"
            >
              <div
                className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${item.tone} opacity-70 transition-opacity duration-500 group-hover:opacity-100`}
              />
              <h3 className="text-2xl font-semibold text-white">{item.title}</h3>
              <p className="mt-4 text-base leading-7 text-slate-400 transition-colors duration-500 group-hover:text-orange-100">
                {item.intro}
              </p>
              <div className="mt-8 space-y-3">
                {item.points.map((point) => (
                  <div
                    key={point}
                    className="flex items-center gap-3 text-slate-500 transition-colors duration-500 group-hover:text-slate-200"
                  >
                    <span className="h-px w-8 bg-gradient-to-r from-orange-400/60 to-transparent" />
                    <span className="text-sm font-medium">{point}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function AIScannerCard({ copy }) {
  return (
    <motion.div
      variants={fadeUp}
      className="relative min-h-[420px] overflow-hidden rounded-3xl border border-cyan-200/20 bg-black/45 p-6 shadow-[0_30px_120px_rgba(34,211,238,0.12)] backdrop-blur-md sm:p-8 lg:col-span-2"
    >
      <div className="theme-ai-aura absolute inset-0 bg-[linear-gradient(135deg,rgba(139,92,246,0.18),transparent_38%,rgba(34,211,238,0.14))]" />
      <div className="relative z-10 flex h-full flex-col justify-between gap-10 lg:flex-row lg:items-center">
        <div className="max-w-lg">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-200/20 bg-cyan-200/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-100">
            <Zap className="h-4 w-4" {...iconProps} />
            {copy.eyebrow}
          </div>
          <h3 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            {copy.title}
          </h3>
          <p className="mt-5 text-base leading-8 text-slate-300">
            {copy.copy}
          </p>
        </div>

        <div className="mx-auto w-full max-w-[360px]">
          <div className="relative aspect-square w-full">
            <div className="absolute inset-0 rounded-full border border-white/10 bg-white/[0.03]" />
            <div className="absolute inset-[12%] rounded-full border border-cyan-200/20" />
            <div className="absolute inset-[24%] rounded-full border border-violet-300/20" />
            <motion.div
              className="absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,transparent_0deg,rgba(34,211,238,0.55)_34deg,transparent_72deg)]"
              animate={{ rotate: 360 }}
              transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
            />
            <div className="absolute inset-[36%] rounded-full border border-white/10 bg-slate-950/80 backdrop-blur-md" />
            <div className="absolute inset-0 z-10 flex items-center justify-center">
              <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-center backdrop-blur-md">
                <Radar className="mx-auto h-9 w-9 text-cyan-200 sm:h-11 sm:w-11" {...iconProps} />
                <p className="mt-2 text-sm font-medium text-white">{copy.match}</p>
                <p className="mt-1 max-w-[9rem] text-xs leading-5 text-slate-400">{copy.brief}</p>
              </div>
            </div>
            {copy.signals.map((label, index) => (
              <div
                key={label}
                className={`absolute hidden rounded-full border border-white/10 bg-black/45 px-3 py-1.5 text-xs font-medium text-slate-200 shadow-[0_10px_30px_rgba(15,23,42,0.14)] backdrop-blur-md sm:block ${
                  [
                    "left-1/2 top-3 -translate-x-1/2",
                    "right-0 top-1/2 -translate-y-1/2",
                    "bottom-3 left-1/2 -translate-x-1/2",
                    "left-0 top-1/2 -translate-y-1/2",
                  ][index]
                }`}
              >
                {label}
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:hidden">
            {copy.signals.map((label) => (
              <div
                key={label}
                className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-2 text-center text-xs font-medium text-slate-200 backdrop-blur-md"
              >
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function EcosystemSection({ copy }) {
  return (
    <section id="ecosystem" className="relative bg-black px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionIntro
          eyebrow={copy.eyebrow}
          title={copy.title}
          copy={copy.copy}
        />

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-120px" }}
          className="grid gap-5 lg:grid-cols-4"
        >
          <AIScannerCard copy={copy.ai} />
          {copy.items.map((item) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                variants={fadeUp}
                className="group rounded-3xl border border-white/10 bg-white/[0.035] p-6 backdrop-blur-md transition-all duration-500 hover:-translate-y-1 hover:border-cyan-200/25 hover:bg-white/[0.055]"
              >
                <Icon className="h-7 w-7 text-cyan-200" {...iconProps} />
                <h3 className="mt-6 text-xl font-semibold text-white">{item.title}</h3>
                <p className="mt-4 text-sm leading-7 text-slate-400">{item.copy}</p>
                <p className="mt-8 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 transition-colors duration-500 group-hover:text-cyan-200">
                  {item.meta}
                </p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

function TiltCard({ children, className = "" }) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  function handleMove(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: y * -8, y: x * 10 });
  }

  return (
    <motion.div
      onMouseMove={handleMove}
      onMouseLeave={() => setTilt({ x: 0, y: 0 })}
      animate={{ rotateX: tilt.x, rotateY: tilt.y }}
      transition={{ type: "spring", stiffness: 180, damping: 18 }}
      style={{ transformStyle: "preserve-3d" }}
      className={`rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-md ${className}`}
    >
      {children}
    </motion.div>
  );
}

function SecuritySection({ copy }) {
  return (
    <section id="security" className="relative bg-slate-950 px-4 py-24 sm:px-6 lg:px-8">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-300/40 to-transparent" />
      <div className="mx-auto max-w-7xl">
        <SectionIntro
          eyebrow={copy.eyebrow}
          title={copy.title}
          copy={copy.copy}
        />

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-120px" }}
          className="grid gap-5 lg:grid-cols-4"
        >
          {copy.flow.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div key={step.title} variants={fadeUp} className="relative">
                <TiltCard className="h-full min-h-[240px] transition-colors duration-500 hover:border-cyan-200/30">
                  <div className="flex h-full flex-col justify-between">
                    <div>
                      <div className="mb-6 flex items-center justify-between">
                        <div className="rounded-2xl border border-white/10 bg-black/30 p-3 text-cyan-200">
                          <Icon className="h-6 w-6" {...iconProps} />
                        </div>
                        <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                          0{index + 1}
                        </span>
                      </div>
                      <h3 className="text-xl font-semibold text-white">{step.title}</h3>
                      <p className="mt-4 text-sm leading-7 text-slate-400">{step.copy}</p>
                    </div>
                    <div className="mt-8 h-1 rounded-full bg-gradient-to-r from-violet-500 via-slate-200 to-cyan-300" />
                  </div>
                </TiltCard>
                {index < copy.flow.length - 1 && (
                  <div className="pointer-events-none absolute left-full top-1/2 z-10 hidden h-px w-5 bg-gradient-to-r from-cyan-300/60 to-transparent lg:block" />
                )}
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

function WorkflowSection({ copy }) {
  const timelineRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: timelineRef,
    offset: ["start 70%", "end 48%"],
  });
  const lineScale = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 24,
    mass: 0.25,
  });

  return (
    <section id="workflow" className="relative bg-black px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <SectionIntro
          eyebrow={copy.eyebrow}
          title={copy.title}
          copy={copy.copy}
        />

        <div ref={timelineRef} className="relative mx-auto max-w-3xl">
          <div className="absolute left-6 top-0 h-full w-px bg-white/10 sm:left-1/2" />
          <motion.div
            style={{ scaleY: lineScale, transformOrigin: "top" }}
            className="absolute left-6 top-0 h-full w-px bg-gradient-to-b from-violet-500 via-slate-200 to-cyan-300 sm:left-1/2"
          />
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-120px" }}
            className="space-y-8"
          >
            {copy.steps.map((step, index) => {
              const Icon = step.icon;
              const isRight = index % 2 === 1;
              return (
                <motion.div
                  key={step.title}
                  variants={fadeUp}
                  className={`relative grid gap-6 pl-16 sm:grid-cols-2 sm:pl-0 ${
                    isRight ? "" : "sm:text-right"
                  }`}
                >
                  <div
                    className={`rounded-3xl border border-white/10 bg-white/[0.035] p-6 backdrop-blur-md ${
                      isRight ? "sm:col-start-2" : ""
                    }`}
                  >
                    <div
                      className={`mb-4 flex items-center gap-3 ${
                        isRight ? "" : "sm:justify-end"
                      }`}
                    >
                      <Icon className="h-5 w-5 text-cyan-200" {...iconProps} />
                      <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                        {copy.stepLabel} 0{index + 1}
                      </span>
                    </div>
                    <h3 className="text-xl font-semibold text-white">{step.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-400">{step.copy}</p>
                  </div>
                  <div className="absolute left-[18px] top-8 h-4 w-4 rounded-full border border-cyan-200/40 bg-slate-950 shadow-[0_0_24px_rgba(34,211,238,0.45)] sm:left-1/2 sm:-translate-x-1/2" />
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function TestimonialCard({ item }) {
  return (
    <div className="mx-2 inline-flex w-[320px] items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 align-top backdrop-blur-md sm:w-[380px]">
      <img
        src={item.image}
        alt={item.name}
        className="h-16 w-16 rounded-2xl object-cover"
      />
      <div className="min-w-0">
        <div className="mb-2 flex text-cyan-200">
          {Array.from({ length: 5 }).map((_, index) => (
            <Star key={index} className="h-3.5 w-3.5 fill-cyan-200" {...iconProps} />
          ))}
        </div>
        <p className="line-clamp-2 text-sm leading-6 text-slate-200">{item.quote}</p>
        <p className="mt-2 text-xs font-medium text-slate-500">
          {item.name} / {item.role}
        </p>
      </div>
    </div>
  );
}

function MarqueeRow({ reverse = false, testimonials }) {
  const row = [...testimonials, ...testimonials];
  return (
    <div className="relative flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
      <div
        className={`flex min-w-max ${
          reverse ? "animate-marquee-reverse" : "animate-marquee"
        }`}
      >
        {row.map((item, index) => (
          <TestimonialCard key={`${item.name}-${index}`} item={item} />
        ))}
      </div>
    </div>
  );
}

function SocialProofSection({ copy }) {
  return (
    <section className="relative bg-slate-950 px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionIntro
          eyebrow={copy.eyebrow}
          title={copy.title}
          copy={copy.copy}
        />
      </div>
      <div className="space-y-4">
        <MarqueeRow testimonials={copy.testimonials} />
        <MarqueeRow reverse testimonials={copy.testimonials} />
      </div>
    </section>
  );
}

function PricingSection({ copy }) {
  const [mode, setMode] = useState("client");
  const active = copy.content[mode];
  const Icon = active.icon;

  return (
    <section id="pricing" className="relative bg-black px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <SectionIntro
          eyebrow={copy.eyebrow}
          title={copy.title}
          copy={copy.copy}
        />

        <div className="mx-auto mb-8 grid max-w-md grid-cols-2 rounded-full border border-white/10 bg-white/[0.04] p-1 backdrop-blur-md">
          {[
            ["client", copy.tabs.client],
            ["photographer", copy.tabs.photographer],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setMode(key)}
              className={`rounded-full px-4 py-2.5 text-sm font-semibold transition-all duration-300 ${
                mode === key
                  ? "bg-white text-slate-950"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] p-6 backdrop-blur-md sm:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.35, ease }}
              className="grid gap-8 md:grid-cols-[0.9fr_1.1fr] md:items-center"
            >
              <div>
                <div className="mb-5 inline-flex rounded-2xl border border-cyan-200/20 bg-cyan-200/10 p-3 text-cyan-100">
                  <Icon className="h-7 w-7" {...iconProps} />
                </div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-200">
                  {active.eyebrow}
                </p>
                <h3 className="mt-3 text-4xl font-semibold tracking-tight text-white">
                  {active.title}
                </h3>
                <p className="mt-5 text-base leading-8 text-slate-300">{active.copy}</p>
              </div>
              <div className="grid gap-3">
                {active.stats.map((stat) => (
                  <div
                    key={stat}
                    className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/25 p-4"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-200/10 text-cyan-100">
                      <Check className="h-4 w-4" {...iconProps} />
                    </span>
                    <span className="font-medium text-slate-100">{stat}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

function FinalCTASection({ copy }) {
  return (
    <section className="relative overflow-hidden bg-slate-950 px-4 py-24 sm:px-6 lg:px-8">
      <div className="theme-final-aura absolute inset-0 bg-[linear-gradient(100deg,transparent_0%,rgba(139,92,246,0.16)_28%,rgba(226,232,240,0.12)_50%,rgba(34,211,238,0.14)_72%,transparent_100%)]" />
      <motion.div
        initial={{ x: "-30%" }}
        whileInView={{ x: "30%" }}
        viewport={{ once: false }}
        transition={{ duration: 8, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
        className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-cyan-300/10 to-transparent blur-3xl"
      />
      <motion.div
        variants={stagger}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-120px" }}
        className="relative mx-auto max-w-4xl text-center"
      >
        <motion.div
          variants={fadeUp}
          className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-cyan-100 backdrop-blur-md"
        >
          <ShieldCheck className="h-8 w-8" {...iconProps} />
        </motion.div>
        <motion.h2
          variants={fadeUp}
          className="text-4xl font-semibold tracking-tight text-white sm:text-6xl"
        >
          {copy.title}
        </motion.h2>
        <motion.p
          variants={fadeUp}
          className="mx-auto mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg"
        >
          {copy.copy}
        </motion.p>
        <motion.div variants={fadeUp} className="mt-9">
          <GradientButton className="px-7">{copy.button}</GradientButton>
        </motion.div>
      </motion.div>
    </section>
  );
}

export default function PhotoHubLanding({ language = "en" }) {
  const copy = landingCopy[language] || landingCopy.en;

  return (
    <main className="relative overflow-hidden bg-black text-white">
      <HeroSection copy={{ ...copy.hero, dashboard: copy.dashboard }} />
      <FrictionSection copy={copy.friction} />
      <EcosystemSection copy={copy.ecosystem} />
      <SecuritySection copy={copy.security} />
      <WorkflowSection copy={copy.workflow} />
      <SocialProofSection copy={copy.social} />
      <PricingSection copy={copy.pricing} />
      <FinalCTASection copy={copy.finalCta} />
    </main>
  );
}
