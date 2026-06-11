import "nprogress/nprogress.css";

import nProgress from "nprogress";
import { type FC, useEffect } from "react";
import { Outlet, useNavigation } from "react-router";

nProgress.configure({
  showSpinner: false, // 是否显示右上角螺旋加载提示（通常关掉更简洁）
  speed: 500, // 动画速度（毫秒）
  minimum: 0.1, // 进度条开始时的最小百分比
  easing: "ease", // 动画缓动函数
  trickleSpeed: 200, // 进度条自动递增的频率（毫秒）
});

export const Layout: FC = () => {
  const { state } = useNavigation();
  useEffect(() => {
    if (state === "loading") {
      nProgress.start();
    } else {
      nProgress.done();
    }
  }, [state]);

  return (
    <>
      <Outlet />
    </>
  );
};
