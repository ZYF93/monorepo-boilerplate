import { Button } from "@bc/components";
import { type FC } from "react";

export const Page: FC = () => {
  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-950">
      <section className="mx-auto flex max-w-4xl flex-col gap-4">
        <h1 className="text-2xl font-semibold">BC App</h1>
        <p className="text-sm text-slate-600">应用模板已创建，可以从这里开始业务开发。</p>
        <div>
          <Button onClick={() => console.log("hello bc app")}>开始</Button>
        </div>
      </section>
    </main>
  );
};
