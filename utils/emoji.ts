/**
 * Emoji图标工具类
 * 提供物品资产的emoji图标映射和选择功能
 */

export interface EmojiCategory {
  name: string;
  icon: string;
  emojis: EmojiItem[];
}

export interface EmojiItem {
  emoji: string;
  name: string;
  keywords: string[];
}

/**
 * Emoji图标库
 * 按照物品分类组织，包含丰富的emoji图标
 */
export const EMOJI_LIBRARY: EmojiCategory[] = [
  {
    name: "电子产品",
    icon: "💻",
    emojis: [
      {
        emoji: "💻",
        name: "笔记本电脑",
        keywords: ["电脑", "笔记本", "laptop"],
      },
      {
        emoji: "🖥️",
        name: "台式电脑",
        keywords: ["台式机", "desktop", "主机"],
      },
      { emoji: "📱", name: "手机", keywords: ["电话", "mobile", "phone"] },
      { emoji: "📲", name: "智能手机", keywords: ["智能机", "smartphone"] },
      { emoji: "⌚", name: "智能手表", keywords: ["手表", "watch", "手环"] },
      { emoji: "🎧", name: "耳机", keywords: ["头戴式", "headphone"] },
      {
        emoji: "🎵",
        name: "无线耳机",
        keywords: ["airpods", "蓝牙耳机", "earphone"],
      },
      { emoji: "🎮", name: "游戏机", keywords: ["游戏", "game", "手柄"] },
      { emoji: "🕹️", name: "游戏手柄", keywords: ["joystick", "控制器"] },
      { emoji: "📷", name: "相机", keywords: ["照相机", "camera", "单反"] },
      {
        emoji: "📹",
        name: "摄像机",
        keywords: ["录像机", "video", "camcorder"],
      },
      { emoji: "📺", name: "电视", keywords: ["电视机", "tv", "显示器"] },
      { emoji: "📻", name: "收音机", keywords: ["radio", "音响"] },
      { emoji: "🔌", name: "充电器", keywords: ["插头", "charger", "电源"] },
      { emoji: "🔋", name: "电池", keywords: ["battery", "充电宝"] },
      { emoji: "💡", name: "灯泡", keywords: ["灯", "light", "照明"] },
      { emoji: "🔦", name: "手电筒", keywords: ["flashlight", "电筒"] },
      { emoji: "🖨️", name: "打印机", keywords: ["printer", "打印"] },
      { emoji: "⌨️", name: "键盘", keywords: ["keyboard", "按键"] },
      { emoji: "🖱️", name: "鼠标", keywords: ["mouse", "光电鼠"] },
      {
        emoji: "💾",
        name: "存储设备",
        keywords: ["U盘", "硬盘", "storage", "disk"],
      },
      { emoji: "📀", name: "光盘", keywords: ["cd", "dvd", "disc"] },
      {
        emoji: "📡",
        name: "路由器",
        keywords: ["wifi", "antenna", "网络设备"],
      },
      { emoji: "📟", name: "平板电脑", keywords: ["pad", "tablet", "ipad"] },
    ],
  },
  {
    name: "家具家居",
    icon: "🛋️",
    emojis: [
      { emoji: "🛋️", name: "沙发", keywords: ["sofa", "couch"] },
      { emoji: "🛏️", name: "床", keywords: ["bed", "床垫"] },
      { emoji: "🪑", name: "椅子", keywords: ["chair", "座椅"] },
      { emoji: "🛍️", name: "桌子", keywords: ["table", "desk", "办公桌"] },
      { emoji: "🚪", name: "门", keywords: ["door", "房门"] },
      { emoji: "🪟", name: "窗户", keywords: ["window", "窗"] },
      { emoji: "🪞", name: "镜子", keywords: ["mirror", "镜"] },
      { emoji: "🛁", name: "浴缸", keywords: ["bathtub", "浴盆"] },
      { emoji: "🚿", name: "淋浴", keywords: ["shower", "花洒"] },
      { emoji: "🚽", name: "马桶", keywords: ["toilet", "卫浴"] },
      { emoji: "🧴", name: "收纳盒", keywords: ["收纳", "box", "整理"] },
      { emoji: "🧹", name: "扫帚", keywords: ["broom", "扫把", "清洁"] },
      { emoji: "🧺", name: "洗衣篮", keywords: ["basket", "洗衣"] },
      { emoji: "🪣", name: "水桶", keywords: ["bucket", "桶"] },
      { emoji: "🧲", name: "磁铁", keywords: ["magnet", "磁吸"] },
      { emoji: "🧱", name: "建材", keywords: ["brick", "砖", "装修"] },
    ],
  },
  {
    name: "家用电器",
    icon: "🔌",
    emojis: [
      { emoji: "🧊", name: "冰箱", keywords: ["refrigerator", "冰柜"] },
      { emoji: "🧺", name: "洗衣机", keywords: ["washing", "洗衣"] },
      { emoji: "🌬️", name: "空调", keywords: ["air", "conditioner", "制冷"] },
      { emoji: "🔥", name: "热水器", keywords: ["heater", "加热"] },
      { emoji: "🍳", name: "电饭煲", keywords: ["rice", "cooker", "煮饭"] },
      { emoji: "🥘", name: "电压力锅", keywords: ["pressure", "cooker"] },
      { emoji: "☕", name: "咖啡机", keywords: ["coffee", "maker"] },
      { emoji: "🫖", name: "电水壶", keywords: ["kettle", "烧水"] },
      { emoji: "🥤", name: "榨汁机", keywords: ["blender", "果汁"] },
      { emoji: "🍞", name: "面包机", keywords: ["bread", "toaster"] },
      { emoji: "🧈", name: "微波炉", keywords: ["microwave", "oven"] },
      { emoji: "🥡", name: "电磁炉", keywords: ["induction", "cooker"] },
      { emoji: "🧽", name: "吸尘器", keywords: ["vacuum", "cleaner"] },
      { emoji: "🤖", name: "扫地机器人", keywords: ["robot", "扫地机"] },
      { emoji: "💨", name: "空气净化器", keywords: ["air", "purifier"] },
      { emoji: "🌡️", name: "加湿器", keywords: ["humidifier", "加湿"] },
      { emoji: "🪭", name: "电风扇", keywords: ["fan", "风扇"] },
      { emoji: "🧷", name: "电熨斗", keywords: ["iron", "熨烫"] },
    ],
  },
  {
    name: "服饰配件",
    icon: "👕",
    emojis: [
      { emoji: "👕", name: "T恤", keywords: ["tshirt", "短袖"] },
      { emoji: "👖", name: "裤子", keywords: ["pants", "jeans", "牛仔裤"] },
      { emoji: "🧥", name: "外套", keywords: ["jacket", "coat", "夹克"] },
      { emoji: "🧣", name: "围巾", keywords: ["scarf", "丝巾"] },
      { emoji: "🧤", name: "手套", keywords: ["gloves", "手套"] },
      { emoji: "🧢", name: "帽子", keywords: ["hat", "cap", "鸭舌帽"] },
      { emoji: "👒", name: "草帽", keywords: ["straw", "hat"] },
      { emoji: "🎓", name: "学士帽", keywords: ["graduation", "cap"] },
      { emoji: "👟", name: "运动鞋", keywords: ["sneaker", "shoe", "跑鞋"] },
      { emoji: "👞", name: "皮鞋", keywords: ["leather", "shoe"] },
      { emoji: "👠", name: "高跟鞋", keywords: ["heel", "shoe"] },
      { emoji: "👡", name: "凉鞋", keywords: ["sandal", "拖鞋"] },
      { emoji: "👢", name: "靴子", keywords: ["boot", "长靴"] },
      { emoji: "🧦", name: "袜子", keywords: ["socks", "袜"] },
      { emoji: "👜", name: "手提包", keywords: ["bag", "handbag", "包"] },
      { emoji: "👛", name: "钱包", keywords: ["purse", "wallet"] },
      { emoji: "🎒", name: "背包", keywords: ["backpack", "书包"] },
      { emoji: "👓", name: "眼镜", keywords: ["glasses", "近视镜"] },
      { emoji: "🕶️", name: "太阳镜", keywords: ["sunglasses", "墨镜"] },
      { emoji: "💍", name: "戒指", keywords: ["ring", "婚戒"] },
      { emoji: "📿", name: "项链", keywords: ["necklace", "珠串"] },
      { emoji: "💎", name: "珠宝", keywords: ["jewelry", "宝石", "钻石"] },
      { emoji: "🎀", name: "蝴蝶结", keywords: ["ribbon", "发饰"] },
      { emoji: "🌂", name: "雨伞", keywords: ["umbrella", "伞"] },
    ],
  },
  {
    name: "运动健身",
    icon: "⚽",
    emojis: [
      { emoji: "⚽", name: "足球", keywords: ["soccer", "football"] },
      { emoji: "🏀", name: "篮球", keywords: ["basketball", "篮球"] },
      { emoji: "🏈", name: "橄榄球", keywords: ["football", "美式足球"] },
      { emoji: "⚾", name: "棒球", keywords: ["baseball", "棒球"] },
      { emoji: "🥎", name: "垒球", keywords: ["softball", "垒球"] },
      { emoji: "🎾", name: "网球", keywords: ["tennis", "网球"] },
      { emoji: "🏐", name: "排球", keywords: ["volleyball", "排球"] },
      { emoji: "🏉", name: "橄榄球", keywords: ["rugby", "橄榄球"] },
      { emoji: "🎱", name: "台球", keywords: ["pool", "billiards", "桌球"] },
      {
        emoji: "🏓",
        name: "乒乓球",
        keywords: ["ping", "pong", "table tennis"],
      },
      { emoji: "🏸", name: "羽毛球", keywords: ["badminton", "羽毛球"] },
      { emoji: "🥏", name: "飞盘", keywords: ["frisbee", "飞碟"] },
      { emoji: "🎯", name: "飞镖", keywords: ["dart", "靶"] },
      { emoji: "🎳", name: "保龄球", keywords: ["bowling", "保龄"] },
      { emoji: "🏒", name: "曲棍球", keywords: ["hockey", "冰球"] },
      { emoji: "🏑", name: "曲棍球", keywords: ["field", "hockey"] },
      { emoji: "🥍", name: "长曲棍球", keywords: ["lacrosse"] },
      { emoji: "🏏", name: "板球", keywords: ["cricket"] },
      { emoji: "🥅", name: "球门", keywords: ["goal", "net"] },
      { emoji: "⛳", name: "高尔夫", keywords: ["golf", "高尔夫"] },
      { emoji: "🏋️", name: "哑铃", keywords: ["dumbbell", "杠铃", "健身"] },
      { emoji: "🤸", name: "瑜伽垫", keywords: ["yoga", "mat", "瑜伽"] },
      { emoji: "🚴", name: "自行车", keywords: ["bike", "cycling", "单车"] },
      { emoji: "🛹", name: "滑板", keywords: ["skateboard", "滑板"] },
      { emoji: "🛼", name: "轮滑鞋", keywords: ["roller", "skate"] },
      { emoji: "⛷️", name: "滑雪板", keywords: ["ski", "snowboard", "滑雪"] },
      { emoji: "🏄", name: "冲浪板", keywords: ["surfboard", "冲浪"] },
      { emoji: "🏊", name: "游泳装备", keywords: ["swim", "游泳", "泳镜"] },
      { emoji: "🧘", name: "瑜伽用品", keywords: ["yoga", "冥想"] },
      { emoji: "🥊", name: "拳击手套", keywords: ["boxing", "glove", "拳套"] },
    ],
  },
  {
    name: "书籍文具",
    icon: "📚",
    emojis: [
      { emoji: "📚", name: "书籍", keywords: ["books", "书", "教材"] },
      { emoji: "📖", name: "书本", keywords: ["book", "open", "阅读"] },
      { emoji: "📕", name: "红色书籍", keywords: ["red", "book"] },
      { emoji: "📗", name: "绿色书籍", keywords: ["green", "book"] },
      { emoji: "📘", name: "蓝色书籍", keywords: ["blue", "book"] },
      { emoji: "📙", name: "橙色书籍", keywords: ["orange", "book"] },
      { emoji: "📓", name: "笔记本", keywords: ["notebook", "笔记"] },
      { emoji: "📒", name: "记事本", keywords: ["ledger", "账本"] },
      { emoji: "📃", name: "文件", keywords: ["document", "文档"] },
      { emoji: "📄", name: "纸张", keywords: ["paper", "page"] },
      { emoji: "📑", name: "文件夹", keywords: ["folder", "档案"] },
      { emoji: "🗂️", name: "文件柜", keywords: ["cabinet", "档案柜"] },
      { emoji: "📰", name: "报纸", keywords: ["newspaper", "新闻"] },
      { emoji: "🗞️", name: "卷报纸", keywords: ["rolled", "newspaper"] },
      { emoji: "📝", name: "备忘录", keywords: ["memo", "便签"] },
      { emoji: "✏️", name: "铅笔", keywords: ["pencil", "铅笔"] },
      { emoji: "✒️", name: "钢笔", keywords: ["pen", "钢笔"] },
      { emoji: "🖊️", name: "圆珠笔", keywords: ["ballpoint", "pen"] },
      { emoji: "🖌️", name: "画笔", keywords: ["paintbrush", "画笔"] },
      { emoji: "🖍️", name: "蜡笔", keywords: ["crayon", "彩笔"] },
      { emoji: "📐", name: "三角板", keywords: ["ruler", "尺子"] },
      { emoji: "📏", name: "直尺", keywords: ["straight", "ruler"] },
      { emoji: "📎", name: "回形针", keywords: ["paperclip", "夹子"] },
      { emoji: "🖇️", name: "订书机", keywords: ["stapler", "订书钉"] },
      { emoji: "📌", name: "图钉", keywords: ["pushpin", "大头针"] },
      { emoji: "📍", name: "圆图钉", keywords: ["round", "pushpin"] },
      { emoji: "✂️", name: "剪刀", keywords: ["scissors", "剪刀"] },
      { emoji: "🗃️", name: "卡片盒", keywords: ["card", "box"] },
    ],
  },
  {
    name: "厨房用品",
    icon: "🍳",
    emojis: [
      { emoji: "🍳", name: "平底锅", keywords: ["pan", "frying", "煎锅"] },
      { emoji: "🥘", name: "炒锅", keywords: ["wok", "pot", "锅"] },
      { emoji: "🍲", name: "汤锅", keywords: ["pot", "soup", "炖锅"] },
      { emoji: "🥣", name: "碗", keywords: ["bowl", "碗"] },
      { emoji: "🍽️", name: "餐具", keywords: ["plate", "dish", "盘子"] },
      { emoji: "🥢", name: "筷子", keywords: ["chopsticks", "筷子"] },
      { emoji: "🍴", name: "刀叉", keywords: ["fork", "knife", "餐具"] },
      { emoji: "🥄", name: "勺子", keywords: ["spoon", "勺"] },
      { emoji: "🔪", name: "菜刀", keywords: ["knife", "刀", "厨刀"] },
      { emoji: "🧊", name: "冰格", keywords: ["ice", "cube"] },
      { emoji: "🧂", name: "调料盒", keywords: ["salt", "调料"] },
      { emoji: "🥫", name: "罐头", keywords: ["can", "罐"] },
      { emoji: "🫙", name: "玻璃罐", keywords: ["jar", "瓶子"] },
      { emoji: "🍷", name: "酒杯", keywords: ["wine", "glass", "红酒杯"] },
      { emoji: "🍸", name: "鸡尾酒杯", keywords: ["cocktail", "glass"] },
      { emoji: "🍹", name: "饮料杯", keywords: ["drink", "cup"] },
      { emoji: "🍺", name: "啤酒杯", keywords: ["beer", "mug"] },
      { emoji: "🥤", name: "水杯", keywords: ["cup", "water", "杯子"] },
      { emoji: "🧃", name: "果汁盒", keywords: ["juice", "box"] },
      { emoji: "🧉", name: "茶具", keywords: ["tea", "cup", "茶杯"] },
      { emoji: "🫖", name: "茶壶", keywords: ["teapot", "茶壶"] },
    ],
  },
  {
    name: "工具维修",
    icon: "🔧",
    emojis: [
      { emoji: "🔧", name: "扳手", keywords: ["wrench", "扳手"] },
      { emoji: "🔨", name: "锤子", keywords: ["hammer", "锤"] },
      { emoji: "🪓", name: "斧头", keywords: ["axe", "斧"] },
      { emoji: "⛏️", name: "镐", keywords: ["pick", "镐"] },
      { emoji: "🛠️", name: "工具箱", keywords: ["tools", "工具"] },
      { emoji: "🔩", name: "螺丝钉", keywords: ["screw", "螺丝"] },
      { emoji: "⚙️", name: "齿轮", keywords: ["gear", "齿轮"] },
      { emoji: "🪛", name: "螺丝刀", keywords: ["screwdriver", "起子"] },
      { emoji: "🪚", name: "锯子", keywords: ["saw", "锯"] },
      { emoji: "📐", name: "量角器", keywords: ["protractor", "测量"] },
      { emoji: "📏", name: "卷尺", keywords: ["ruler", "measure", "尺子"] },
      { emoji: "⚖️", name: "天平", keywords: ["scale", "balance", "秤"] },
      { emoji: "🔗", name: "链条", keywords: ["link", "chain"] },
      { emoji: "⛓️", name: "锁链", keywords: ["chains", "锁"] },
      { emoji: "🧰", name: "工具箱", keywords: ["toolbox", "工具盒"] },
      { emoji: "🪤", name: "捕鼠器", keywords: ["trap", "陷阱"] },
      { emoji: "🪜", name: "梯子", keywords: ["ladder", "梯"] },
      { emoji: "🧱", name: "砖块", keywords: ["brick", "砖"] },
      { emoji: "🪨", name: "石头", keywords: ["stone", "rock"] },
      { emoji: "🪵", name: "木头", keywords: ["wood", "木"] },
    ],
  },
  {
    name: "玩具娱乐",
    icon: "🎮",
    emojis: [
      { emoji: "🎮", name: "游戏机", keywords: ["game", "console", "游戏"] },
      { emoji: "🕹️", name: "游戏摇杆", keywords: ["joystick", "摇杆"] },
      { emoji: "🎲", name: "骰子", keywords: ["dice", "骰子"] },
      { emoji: "🧩", name: "拼图", keywords: ["puzzle", "拼图"] },
      { emoji: "♟️", name: "棋子", keywords: ["chess", "棋"] },
      { emoji: "🎯", name: "飞镖盘", keywords: ["dart", "靶子"] },
      { emoji: "🪀", name: "溜溜球", keywords: ["yoyo", "悠悠球"] },
      { emoji: "🪁", name: "风筝", keywords: ["kite", "风筝"] },
      { emoji: "🧸", name: "泰迪熊", keywords: ["teddy", "bear", "玩偶"] },
      { emoji: "🪆", name: "套娃", keywords: ["doll", "套娃"] },
      { emoji: "🎨", name: "画板", keywords: ["palette", "画板", "颜料"] },
      { emoji: "🖼️", name: "画框", keywords: ["frame", "相框"] },
      { emoji: "🎭", name: "面具", keywords: ["mask", "面具"] },
      { emoji: "🎪", name: "马戏团", keywords: ["circus", "tent"] },
      { emoji: "🤹", name: "杂耍", keywords: ["juggling", "杂技"] },
      { emoji: "🎢", name: "过山车", keywords: ["roller", "coaster"] },
      { emoji: "🎡", name: "摩天轮", keywords: ["ferris", "wheel"] },
      { emoji: "🎠", name: "旋转木马", keywords: ["carousel", "horse"] },
      { emoji: "🃏", name: "扑克牌", keywords: ["card", "joker", "扑克"] },
      { emoji: "🀄", name: "麻将", keywords: ["mahjong", "麻将"] },
      { emoji: "🎴", name: "花札", keywords: ["flower", "cards"] },
    ],
  },
  {
    name: "乐器音乐",
    icon: "🎸",
    emojis: [
      { emoji: "🎸", name: "吉他", keywords: ["guitar", "吉他"] },
      { emoji: "🎹", name: "钢琴", keywords: ["piano", "keyboard", "键盘"] },
      { emoji: "🎺", name: "小号", keywords: ["trumpet", "号"] },
      { emoji: "🎷", name: "萨克斯", keywords: ["saxophone", "萨克斯风"] },
      { emoji: "🥁", name: "鼓", keywords: ["drum", "鼓"] },
      { emoji: "🎻", name: "小提琴", keywords: ["violin", "提琴"] },
      { emoji: "🪕", name: "班卓琴", keywords: ["banjo", "琴"] },
      { emoji: "🪗", name: "手风琴", keywords: ["accordion", "风琴"] },
      { emoji: "🎤", name: "麦克风", keywords: ["microphone", "话筒"] },
      { emoji: "🎧", name: "耳机", keywords: ["headphone", "耳机"] },
      { emoji: "📻", name: "收音机", keywords: ["radio", "收音机"] },
      { emoji: "🎵", name: "音符", keywords: ["note", "music", "音乐"] },
      { emoji: "🎶", name: "音符", keywords: ["notes", "music"] },
      { emoji: "🎼", name: "乐谱", keywords: ["score", "sheet", "谱子"] },
    ],
  },
  {
    name: "交通工具",
    icon: "🚗",
    emojis: [
      { emoji: "🚗", name: "汽车", keywords: ["car", "轿车"] },
      { emoji: "🚕", name: "出租车", keywords: ["taxi", "的士"] },
      { emoji: "🚙", name: "SUV", keywords: ["suv", "越野车"] },
      { emoji: "🚌", name: "公交车", keywords: ["bus", "巴士"] },
      { emoji: "🚎", name: "电车", keywords: ["trolleybus", "电车"] },
      { emoji: "🏎️", name: "赛车", keywords: ["racing", "car", "跑车"] },
      { emoji: "🚓", name: "警车", keywords: ["police", "car"] },
      { emoji: "🚑", name: "救护车", keywords: ["ambulance"] },
      { emoji: "🚒", name: "消防车", keywords: ["fire", "engine"] },
      { emoji: "🚐", name: "面包车", keywords: ["minibus", "van"] },
      { emoji: "🚚", name: "货车", keywords: ["truck", "卡车"] },
      { emoji: "🚛", name: "大货车", keywords: ["lorry", "大卡车"] },
      { emoji: "🚜", name: "拖拉机", keywords: ["tractor", "农用车"] },
      { emoji: "🛴", name: "滑板车", keywords: ["scooter", "电动滑板"] },
      { emoji: "🚲", name: "自行车", keywords: ["bicycle", "bike", "单车"] },
      {
        emoji: "🛵",
        name: "摩托车",
        keywords: ["motorcycle", "scooter", "摩托"],
      },
      { emoji: "🏍️", name: "赛车摩托", keywords: ["racing", "motorcycle"] },
      { emoji: "🛺", name: "三轮车", keywords: ["auto", "rickshaw"] },
      { emoji: "🚨", name: "警灯", keywords: ["police", "light"] },
      { emoji: "🚥", name: "红绿灯", keywords: ["traffic", "light"] },
      { emoji: "🚦", name: "红绿灯", keywords: ["traffic", "signal"] },
      { emoji: "⛽", name: "加油站", keywords: ["fuel", "pump", "汽油"] },
      { emoji: "🛞", name: "轮胎", keywords: ["wheel", "tire"] },
      { emoji: "🛻", name: "皮卡车", keywords: ["pickup", "truck"] },
    ],
  },
  {
    name: "户外旅行",
    icon: "🏕️",
    emojis: [
      { emoji: "🏕️", name: "帐篷", keywords: ["tent", "露营"] },
      { emoji: "⛺", name: "帐篷", keywords: ["tent", "camping"] },
      { emoji: "🏞️", name: "风景", keywords: ["scenery", "风景"] },
      { emoji: "🌅", name: "日出", keywords: ["sunrise", "日出"] },
      { emoji: "🌄", name: "山峰", keywords: ["mountain", "山"] },
      { emoji: "🏔️", name: "雪山", keywords: ["snow", "mountain"] },
      { emoji: "⛰️", name: "山", keywords: ["mountain"] },
      { emoji: "🌋", name: "火山", keywords: ["volcano"] },
      { emoji: "🗻", name: "富士山", keywords: ["fuji", "mountain"] },
      { emoji: "🏕️", name: "露营", keywords: ["camping", "野营"] },
      { emoji: "🏖️", name: "沙滩", keywords: ["beach", "沙滩"] },
      { emoji: "🏜️", name: "沙漠", keywords: ["desert", "沙漠"] },
      { emoji: "🏝️", name: "岛屿", keywords: ["island", "岛"] },
      { emoji: "🧭", name: "指南针", keywords: ["compass", "指南针"] },
      { emoji: "🗺️", name: "地图", keywords: ["map", "地图"] },
      { emoji: "🧳", name: "行李箱", keywords: ["luggage", "行李", "箱子"] },
      { emoji: "🎒", name: "背包", keywords: ["backpack", "背包"] },
      { emoji: "🥾", name: "登山鞋", keywords: ["hiking", "boot", "徒步鞋"] },
      { emoji: "🧗", name: "攀岩装备", keywords: ["climbing", "攀岩"] },
      { emoji: "🚣", name: "皮划艇", keywords: ["canoe", "kayak", "划艇"] },
      { emoji: "🎣", name: "钓鱼竿", keywords: ["fishing", "pole", "鱼竿"] },
      { emoji: "🔦", name: "手电筒", keywords: ["flashlight", "电筒"] },
      { emoji: "🪔", name: "油灯", keywords: ["lamp", "油灯"] },
      { emoji: "🧯", name: "灭火器", keywords: ["fire", "extinguisher"] },
    ],
  },
  {
    name: "宠物用品",
    icon: "🐕",
    emojis: [
      { emoji: "🐕", name: "狗", keywords: ["dog", "狗", "宠物"] },
      { emoji: "🐩", name: "贵宾犬", keywords: ["poodle", "贵宾"] },
      { emoji: "🐈", name: "猫", keywords: ["cat", "猫"] },
      { emoji: "🐈‍⬛", name: "黑猫", keywords: ["black", "cat"] },
      { emoji: "🐦", name: "鸟", keywords: ["bird", "鸟"] },
      { emoji: "🐤", name: "小鸡", keywords: ["chick", "鸡"] },
      { emoji: "🦜", name: "鹦鹉", keywords: ["parrot", "鹦鹉"] },
      { emoji: "🐹", name: "仓鼠", keywords: ["hamster", "仓鼠"] },
      { emoji: "🐰", name: "兔子", keywords: ["rabbit", "兔"] },
      { emoji: "🦊", name: "狐狸", keywords: ["fox", "狐狸"] },
      { emoji: "🐻", name: "熊", keywords: ["bear", "熊"] },
      { emoji: "🐼", name: "熊猫", keywords: ["panda", "熊猫"] },
      { emoji: "🐨", name: "考拉", keywords: ["koala", "考拉"] },
      { emoji: "🦁", name: "狮子", keywords: ["lion", "狮子"] },
      { emoji: "🐯", name: "老虎", keywords: ["tiger", "老虎"] },
      { emoji: "🦒", name: "长颈鹿", keywords: ["giraffe", "长颈鹿"] },
      { emoji: "🐘", name: "大象", keywords: ["elephant", "大象"] },
      { emoji: "🦓", name: "斑马", keywords: ["zebra", "斑马"] },
      { emoji: "🦌", name: "鹿", keywords: ["deer", "鹿"] },
      { emoji: "🐮", name: "牛", keywords: ["cow", "牛"] },
      { emoji: "🐷", name: "猪", keywords: ["pig", "猪"] },
      { emoji: "🐸", name: "青蛙", keywords: ["frog", "青蛙"] },
      { emoji: "🐒", name: "猴子", keywords: ["monkey", "猴子"] },
      { emoji: "🦆", name: "鸭子", keywords: ["duck", "鸭"] },
      { emoji: "🦅", name: "鹰", keywords: ["eagle", "鹰"] },
      { emoji: "🦉", name: "猫头鹰", keywords: ["owl", "猫头鹰"] },
      { emoji: "🦇", name: "蝙蝠", keywords: ["bat", "蝙蝠"] },
      { emoji: "🐺", name: "狼", keywords: ["wolf", "狼"] },
      { emoji: "🐗", name: "野猪", keywords: ["boar", "野猪"] },
      { emoji: "🐴", name: "马", keywords: ["horse", "马"] },
      { emoji: "🐠", name: "热带鱼", keywords: ["fish", "鱼"] },
      { emoji: "🐟", name: "鱼", keywords: ["fish"] },
      { emoji: "🐡", name: "河豚", keywords: ["blowfish", "河豚"] },
      { emoji: "🦈", name: "鲨鱼", keywords: ["shark", "鲨鱼"] },
      { emoji: "🐙", name: "章鱼", keywords: ["octopus", "章鱼"] },
      { emoji: "🐚", name: "贝壳", keywords: ["shell", "贝壳"] },
      { emoji: "🐌", name: "蜗牛", keywords: ["snail", "蜗牛"] },
      { emoji: "🦋", name: "蝴蝶", keywords: ["butterfly", "蝴蝶"] },
      { emoji: "🐛", name: "毛虫", keywords: ["caterpillar", "毛虫"] },
      { emoji: "🐜", name: "蚂蚁", keywords: ["ant", "蚂蚁"] },
      { emoji: "🐝", name: "蜜蜂", keywords: ["bee", "蜜蜂"] },
      { emoji: "🪲", name: "甲虫", keywords: ["beetle", "甲虫"] },
      { emoji: "🐞", name: "瓢虫", keywords: ["ladybug", "瓢虫"] },
      { emoji: "🦗", name: "蟋蟀", keywords: ["cricket", "蟋蟀"] },
      { emoji: "🪳", name: "蟑螂", keywords: ["cockroach", "蟑螂"] },
      { emoji: "🕷️", name: "蜘蛛", keywords: ["spider", "蜘蛛"] },
      { emoji: "🦂", name: "蝎子", keywords: ["scorpion", "蝎子"] },
      { emoji: "🦀", name: "螃蟹", keywords: ["crab", "螃蟹"] },
      { emoji: "🦞", name: "龙虾", keywords: ["lobster", "龙虾"] },
      { emoji: "🦐", name: "虾", keywords: ["shrimp", "虾"] },
      { emoji: "🐢", name: "乌龟", keywords: ["turtle", "乌龟"] },
      { emoji: "🐍", name: "蛇", keywords: ["snake", "蛇"] },
      { emoji: "🦎", name: "蜥蜴", keywords: ["lizard", "蜥蜴"] },
      { emoji: "🦖", name: "霸王龙", keywords: ["t-rex", "恐龙"] },
      { emoji: "🦕", name: "蜥脚龙", keywords: ["sauropod", "恐龙"] },
    ],
  },
  {
    name: "植物花卉",
    icon: "🌸",
    emojis: [
      { emoji: "🌸", name: "樱花", keywords: ["cherry", "blossom", "樱花"] },
      { emoji: "🌷", name: "郁金香", keywords: ["tulip", "郁金香"] },
      { emoji: "🌹", name: "玫瑰", keywords: ["rose", "玫瑰"] },
      { emoji: "🌺", name: "芙蓉花", keywords: ["hibiscus", "芙蓉"] },
      { emoji: "🌼", name: "雏菊", keywords: ["daisy", "雏菊"] },
      { emoji: "🌻", name: "向日葵", keywords: ["sunflower", "向日葵"] },
      { emoji: " bud", name: "花蕾", keywords: ["bud", "花苞"] },
      { emoji: "💐", name: "花束", keywords: ["bouquet", "花束"] },
      { emoji: "🌾", name: "稻穗", keywords: ["rice", "稻谷"] },
      { emoji: "🌿", name: "草药", keywords: ["herb", "草药"] },
      { emoji: "☘️", name: "三叶草", keywords: ["shamrock", "三叶草"] },
      { emoji: "🍀", name: "四叶草", keywords: ["clover", "四叶草"] },
      { emoji: "🍁", name: "枫叶", keywords: ["maple", "leaf", "枫叶"] },
      { emoji: "🍂", name: "落叶", keywords: ["fallen", "leaf"] },
      { emoji: "🍃", name: "绿叶", keywords: ["leaf", "叶子"] },
      { emoji: "🌱", name: "幼苗", keywords: ["seedling", "苗"] },
      { emoji: "🌲", name: "松树", keywords: ["pine", "tree", "松树"] },
      { emoji: "🌳", name: "大树", keywords: ["tree", "树"] },
      { emoji: "🌴", name: "棕榈树", keywords: ["palm", "tree"] },
      { emoji: "🌵", name: "仙人掌", keywords: ["cactus", "仙人掌"] },
      { emoji: "🎋", name: "竹子", keywords: ["bamboo", "竹"] },
      { emoji: "🎍", name: "门松", keywords: ["pine", "decoration"] },
      { emoji: "🪴", name: "盆栽", keywords: ["potted", "plant", "盆栽"] },
      { emoji: "🪷", name: "莲花", keywords: ["lotus", "莲花"] },
      { emoji: "🪻", name: "风信子", keywords: ["hyacinth", "风信子"] },
    ],
  },
  {
    name: "食品饮料",
    icon: "🍔",
    emojis: [
      { emoji: "🍔", name: "汉堡", keywords: ["burger", "汉堡包"] },
      { emoji: "🍟", name: "薯条", keywords: ["fries", "薯条"] },
      { emoji: "🍕", name: "披萨", keywords: ["pizza", "披萨"] },
      { emoji: "🌭", name: "热狗", keywords: ["hotdog", "热狗"] },
      { emoji: "🥪", name: "三明治", keywords: ["sandwich", "三明治"] },
      { emoji: "🌮", name: "墨西哥卷", keywords: ["taco", "塔可"] },
      { emoji: "🌯", name: "卷饼", keywords: ["burrito", "卷饼"] },
      { emoji: "🥙", name: "口袋饼", keywords: ["pita", "面包"] },
      { emoji: "🧆", name: "沙拉三明治", keywords: ["falafel"] },
      { emoji: "🥚", name: "鸡蛋", keywords: ["egg", "鸡蛋"] },
      { emoji: "🍳", name: "煎蛋", keywords: ["fried", "egg"] },
      { emoji: "🥞", name: "煎饼", keywords: ["pancake", "煎饼"] },
      { emoji: "🧇", name: "华夫饼", keywords: ["waffle", "华夫饼"] },
      { emoji: "🥓", name: "培根", keywords: ["bacon", "培根"] },
      { emoji: "🥩", name: "牛排", keywords: ["steak", "牛排"] },
      { emoji: "🍗", name: "鸡腿", keywords: ["chicken", "leg"] },
      { emoji: "🍖", name: "肉骨头", keywords: ["meat", "bone"] },
      { emoji: "🌭", name: "香肠", keywords: ["sausage", "香肠"] },
      { emoji: "🍔", name: "快餐", keywords: ["fast", "food"] },
      { emoji: "🍱", name: "便当", keywords: ["bento", "便当"] },
      { emoji: "🍘", name: "米饼", keywords: ["rice", "cracker"] },
      { emoji: "🍙", name: "饭团", keywords: ["rice", "ball"] },
      { emoji: "🍚", name: "米饭", keywords: ["rice", "饭"] },
      { emoji: "🍛", name: "咖喱饭", keywords: ["curry", "rice"] },
      { emoji: "🍜", name: "拉面", keywords: ["ramen", "面条"] },
      { emoji: "🍝", name: "意大利面", keywords: ["spaghetti", "意面"] },
      { emoji: "🍠", name: "烤红薯", keywords: ["sweet", "potato"] },
      { emoji: "🍢", name: "关东煮", keywords: ["oden", "串"] },
      { emoji: "🍣", name: "寿司", keywords: ["sushi", "寿司"] },
      { emoji: "🍤", name: "炸虾", keywords: ["shrimp", "fried"] },
      { emoji: "🍥", name: "鱼板", keywords: ["fish", "cake"] },
      { emoji: "🥟", name: "饺子", keywords: ["dumpling", "饺子"] },
      { emoji: "🥠", name: "幸运饼干", keywords: ["fortune", "cookie"] },
      { emoji: "🥡", name: "外卖盒", keywords: ["takeout", "box"] },
      { emoji: "🍦", name: "冰淇淋", keywords: ["ice", "cream"] },
      { emoji: "🍧", name: "刨冰", keywords: ["shaved", "ice"] },
      { emoji: "🍨", name: "冰淇淋", keywords: ["ice", "cream"] },
      { emoji: "🍩", name: "甜甜圈", keywords: ["donut", "甜甜圈"] },
      { emoji: "🍪", name: "饼干", keywords: ["cookie", "饼干"] },
      { emoji: "🎂", name: "生日蛋糕", keywords: ["birthday", "cake"] },
      { emoji: "🍰", name: "蛋糕", keywords: ["cake", "蛋糕"] },
      { emoji: "🧁", name: "纸杯蛋糕", keywords: ["cupcake", "杯子蛋糕"] },
      { emoji: "🥧", name: "派", keywords: ["pie", "派"] },
      { emoji: "🍫", name: "巧克力", keywords: ["chocolate", "巧克力"] },
      { emoji: "🍬", name: "糖果", keywords: ["candy", "糖"] },
      { emoji: "🍭", name: "棒棒糖", keywords: ["lollipop", "棒棒糖"] },
      { emoji: "🍮", name: "布丁", keywords: ["pudding", "布丁"] },
      { emoji: "🍯", name: "蜂蜜", keywords: ["honey", "蜂蜜"] },
      { emoji: "🍼", name: "奶瓶", keywords: ["baby", "bottle", "奶瓶"] },
      { emoji: "🥛", name: "牛奶", keywords: ["milk", "牛奶"] },
      { emoji: "☕", name: "咖啡", keywords: ["coffee", "咖啡"] },
      { emoji: "🍵", name: "茶", keywords: ["tea", "茶"] },
      { emoji: "🧃", name: "果汁", keywords: ["juice", "果汁"] },
      { emoji: "🥤", name: "饮料", keywords: ["drink", "饮料"] },
      { emoji: "🧋", name: "奶茶", keywords: ["bubble", "tea", "奶茶"] },
      { emoji: "🫖", name: "茶壶", keywords: ["teapot", "茶壶"] },
      { emoji: "🍶", name: "清酒", keywords: ["sake", "清酒"] },
      { emoji: "🍾", name: "香槟", keywords: ["champagne", "香槟"] },
      { emoji: "🍷", name: "红酒", keywords: ["wine", "红酒"] },
      { emoji: "🍸", name: "鸡尾酒", keywords: ["cocktail", "鸡尾酒"] },
      { emoji: "🍹", name: "热带饮料", keywords: ["tropical", "drink"] },
      { emoji: "🍺", name: "啤酒", keywords: ["beer", "啤酒"] },
      { emoji: "🍻", name: "干杯", keywords: ["cheers", "干杯"] },
      { emoji: "🥂", name: "庆祝", keywords: ["celebrate", "庆祝"] },
      { emoji: "🥃", name: "威士忌", keywords: ["whiskey", "威士忌"] },
      { emoji: "🫗", name: "倒水", keywords: ["pour", "liquid"] },
      { emoji: "🧊", name: "冰块", keywords: ["ice", "cube"] },
    ],
  },
  {
    name: "医疗健康",
    icon: "💊",
    emojis: [
      { emoji: "💊", name: "药丸", keywords: ["pill", "药", "药品"] },
      { emoji: "💉", name: "注射器", keywords: ["syringe", "注射", "疫苗"] },
      { emoji: "🩹", name: "创可贴", keywords: ["bandage", "创可贴"] },
      { emoji: "🩺", name: "听诊器", keywords: ["stethoscope", "听诊器"] },
      { emoji: "🏥", name: "医院", keywords: ["hospital", "医院"] },
      { emoji: "🚑", name: "救护车", keywords: ["ambulance", "救护车"] },
      { emoji: "🧬", name: "DNA", keywords: ["dna", "基因"] },
      { emoji: "🩸", name: "血液", keywords: ["blood", "血"] },
      { emoji: "🦠", name: "病毒", keywords: ["virus", "细菌"] },
      { emoji: "🧫", name: "培养皿", keywords: ["petri", "dish"] },
      { emoji: "🧪", name: "试管", keywords: ["test", "tube"] },
      { emoji: "🌡️", name: "体温计", keywords: ["thermometer", "温度计"] },
      { emoji: "😷", name: "口罩", keywords: ["mask", "口罩"] },
      { emoji: "🤒", name: "发烧", keywords: ["fever", "发烧"] },
      { emoji: "🤕", name: "受伤", keywords: ["injury", "受伤"] },
      { emoji: "🧴", name: "洗手液", keywords: ["lotion", "洗手液"] },
      { emoji: "🧼", name: "肥皂", keywords: ["soap", "肥皂"] },
      { emoji: "🪥", name: "牙刷", keywords: ["toothbrush", "牙刷"] },
    ],
  },
  {
    name: "办公用品",
    icon: "💼",
    emojis: [
      { emoji: "💼", name: "公文包", keywords: ["briefcase", "公文包"] },
      { emoji: "📊", name: "图表", keywords: ["chart", "图表"] },
      {
        emoji: "📈",
        name: "上升图表",
        keywords: ["chart", "increase", "增长"],
      },
      {
        emoji: "📉",
        name: "下降图表",
        keywords: ["chart", "decrease", "下降"],
      },
      { emoji: "🗒️", name: "便签本", keywords: ["notepad", "便签"] },
      { emoji: "🗓️", name: "日历", keywords: ["calendar", "日历"] },
      { emoji: "📅", name: "日历", keywords: ["calendar", "日期"] },
      { emoji: "📆", name: "日历", keywords: ["calendar", "日程"] },
      { emoji: "📇", name: "卡片索引", keywords: ["card", "index"] },
      { emoji: "🗳️", name: "投票箱", keywords: ["ballot", "box"] },
      { emoji: "🗄️", name: "文件柜", keywords: ["file", "cabinet"] },
      { emoji: "🗑️", name: "垃圾桶", keywords: ["trash", "垃圾桶"] },
      { emoji: "🔒", name: "锁", keywords: ["lock", "锁", "安全"] },
      { emoji: "🔓", name: "开锁", keywords: ["unlock", "开锁"] },
      { emoji: "🔏", name: "带笔锁", keywords: ["lock", "pen"] },
      { emoji: "🔐", name: "带钥匙锁", keywords: ["lock", "key"] },
      { emoji: "🔑", name: "钥匙", keywords: ["key", "钥匙"] },
      { emoji: "🗝️", name: "老钥匙", keywords: ["old", "key"] },
      { emoji: "🔨", name: "锤子", keywords: ["hammer", "锤子"] },
      { emoji: "⛏️", name: "镐", keywords: ["pick", "镐"] },
      { emoji: "⚒️", name: "锤镐", keywords: ["hammer", "pick"] },
      { emoji: "🛠️", name: "工具", keywords: ["tools", "工具"] },
      { emoji: "🗡️", name: "匕首", keywords: ["dagger", "匕首"] },
      { emoji: "⚔️", name: "剑", keywords: ["sword", "剑"] },
      { emoji: "🔫", name: "水枪", keywords: ["water", "gun", "枪"] },
      { emoji: "🪃", name: "回旋镖", keywords: ["boomerang"] },
      { emoji: "🏹", name: "弓箭", keywords: ["bow", "arrow", "弓"] },
      { emoji: "🛡️", name: "盾牌", keywords: ["shield", "盾"] },
      { emoji: "🪓", name: "斧头", keywords: ["axe", "斧"] },
    ],
  },
  {
    name: "其他物品",
    icon: "📦",
    emojis: [
      { emoji: "📦", name: "包裹", keywords: ["package", "包裹", "快递"] },
      { emoji: "📫", name: "邮箱", keywords: ["mailbox", "邮箱"] },
      { emoji: "📪", name: "邮箱", keywords: ["mailbox", "closed"] },
      { emoji: "📬", name: "邮箱", keywords: ["mailbox", "open"] },
      { emoji: "📭", name: "邮箱", keywords: ["mailbox", "empty"] },
      { emoji: "📮", name: "邮筒", keywords: ["postbox", "邮筒"] },
      { emoji: "🗳️", name: "投票箱", keywords: ["ballot", "box"] },
      { emoji: "✏️", name: "铅笔", keywords: ["pencil", "铅笔"] },
      { emoji: "✒️", name: "钢笔", keywords: ["pen", "钢笔"] },
      { emoji: "🖋️", name: "钢笔", keywords: ["fountain", "pen"] },
      { emoji: "🖊️", name: "圆珠笔", keywords: ["pen", "圆珠笔"] },
      { emoji: "🖌️", name: "画笔", keywords: ["paintbrush", "画笔"] },
      { emoji: "🖍️", name: "蜡笔", keywords: ["crayon", "蜡笔"] },
      { emoji: "📝", name: "备忘录", keywords: ["memo", "备忘录"] },
      { emoji: "💼", name: "公文包", keywords: ["briefcase", "公文包"] },
      { emoji: "📁", name: "文件夹", keywords: ["folder", "文件夹"] },
      { emoji: "📂", name: "文件夹", keywords: ["folder", "open"] },
      { emoji: "🗂️", name: "卡片盒", keywords: ["card", "index", "dividers"] },
      { emoji: "📅", name: "日历", keywords: ["calendar", "日历"] },
      { emoji: "📆", name: "日历", keywords: ["calendar", "日程"] },
      { emoji: "🗒️", name: "便签本", keywords: ["spiral", "notepad"] },
      { emoji: "🗓️", name: "日历本", keywords: ["spiral", "calendar"] },
      { emoji: "📇", name: "卡片索引", keywords: ["card", "index"] },
      { emoji: "📈", name: "上升图表", keywords: ["chart", "increasing"] },
      { emoji: "📉", name: "下降图表", keywords: ["chart", "decreasing"] },
      { emoji: "📊", name: "柱状图", keywords: ["bar", "chart"] },
      { emoji: "📋", name: "剪贴板", keywords: ["clipboard", "剪贴板"] },
      { emoji: "📌", name: "图钉", keywords: ["pushpin", "图钉"] },
      { emoji: "📍", name: "圆图钉", keywords: ["round", "pushpin"] },
      { emoji: "📎", name: "回形针", keywords: ["paperclip", "回形针"] },
      { emoji: "🖇️", name: "链接夹", keywords: ["linked", "paperclips"] },
      { emoji: "📏", name: "直尺", keywords: ["straight", "ruler", "尺子"] },
      { emoji: "📐", name: "三角尺", keywords: ["triangular", "ruler"] },
      { emoji: "✂️", name: "剪刀", keywords: ["scissors", "剪刀"] },
      { emoji: "🗃️", name: "卡片盒", keywords: ["card", "file", "box"] },
      { emoji: "🗄️", name: "文件柜", keywords: ["file", "cabinet"] },
      { emoji: "🗑️", name: "垃圾桶", keywords: ["wastebasket", "垃圾桶"] },
      { emoji: "🔒", name: "锁", keywords: ["lock", "锁"] },
      { emoji: "🔓", name: "开锁", keywords: ["unlock", "开锁"] },
      { emoji: "🔏", name: "带笔锁", keywords: ["lock", "with", "pen"] },
      {
        emoji: "🔐",
        name: "带钥匙锁",
        keywords: ["closed", "lock", "with", "key"],
      },
      { emoji: "🔑", name: "钥匙", keywords: ["key", "钥匙"] },
      { emoji: "🗝️", name: "老钥匙", keywords: ["old", "key"] },
    ],
  },
];

/**
 * 根据关键词搜索emoji
 * @param keyword 搜索关键词
 * @returns 匹配的emoji列表
 */
export function search_emoji(keyword: string): EmojiItem[] {
  if (!keyword) return [];

  const lowerKeyword = keyword.toLowerCase();
  const results: EmojiItem[] = [];

  for (const category of EMOJI_LIBRARY) {
    for (const item of category.emojis) {
      if (
        item.name.includes(keyword) ||
        item.keywords.some((k) => k.includes(lowerKeyword))
      ) {
        results.push(item);
      }
    }
  }

  return results;
}

/**
 * 获取所有emoji列表
 * @returns 所有emoji列表
 */
export function get_all_emojis(): EmojiItem[] {
  const allEmojis: EmojiItem[] = [];
  for (const category of EMOJI_LIBRARY) {
    allEmojis.push(...category.emojis);
  }
  return allEmojis;
}

/**
 * 根据物品名称推荐emoji
 * @param itemName 物品名称
 * @returns 推荐的emoji
 */
export function recommend_emoji(itemName: string): string {
  if (!itemName) return "📦";

  const lowerName = itemName.toLowerCase();

  for (const category of EMOJI_LIBRARY) {
    for (const item of category.emojis) {
      if (
        item.name.includes(itemName) ||
        lowerName.includes(item.name.toLowerCase()) ||
        item.keywords.some((k) => lowerName.includes(k))
      ) {
        return item.emoji;
      }
    }
  }

  return "📦";
}

/**
 * 获取随机emoji
 * @returns 随机emoji
 */
export function get_random_emoji(): string {
  const allEmojis = get_all_emojis();
  const randomIndex = Math.floor(Math.random() * allEmojis.length);
  return allEmojis[randomIndex].emoji;
}

/**
 * 根据分类获取emoji列表
 * @param categoryName 分类名称
 * @returns 该分类下的emoji列表
 */
export function get_emojis_by_category(categoryName: string): EmojiItem[] {
  const category = EMOJI_LIBRARY.find((cat) => cat.name === categoryName);
  return category ? category.emojis : [];
}
