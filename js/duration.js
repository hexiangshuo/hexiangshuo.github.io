!(function() {
  /** 计时起始时间，自行修改 **/
  var start = new Date("2026/04/05 16:57:33");

  // ---- 新增：补零工具函数（解决重复） ----
  function padZero(num) {
    if (String(num).length === 1) {
      return "0" + num;
    }
    return String(num);
  }

  function update() {
    var now = new Date();
    now.setTime(now.getTime() + 250);  // 保留原有偏移

    // ---- 拆分计算步骤，增加可读性（第6条） ----
    var diffMs = now - start;
    var totalSeconds = diffMs / 1000;

    var days = totalSeconds / 60 / 60 / 24;
    var dnum = Math.floor(days);

    var hours = totalSeconds / 60 / 60 - (24 * dnum);
    var hnum = Math.floor(hours);
    hnum = padZero(hnum);

    var minutes = totalSeconds / 60 - (24 * 60 * dnum) - (60 * hnum);
    var mnum = Math.floor(minutes);
    mnum = padZero(mnum);

    var seconds = totalSeconds - (24 * 60 * 60 * dnum) - (60 * 60 * hnum) - (60 * mnum);
    var snum = Math.round(seconds);
    snum = padZero(snum);

    // ---- 添加元素存在性检查（第4条） ----
    var timeDateEl = document.getElementById("timeDate");
    var timesEl = document.getElementById("times");
    if (timeDateEl) {
      timeDateEl.innerHTML = "本站在夹缝间苟活&nbsp;" + dnum + "&nbsp;天";
    }
    if (timesEl) {
      timesEl.innerHTML = hnum + "&nbsp;小时&nbsp;" + mnum + "&nbsp;分&nbsp;" + snum + "&nbsp;秒";
    }
  }

  update();
  setInterval(update, 1000);
})();