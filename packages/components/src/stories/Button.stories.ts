import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";

import { Button } from "./Button";

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
  component: Button,
  tags: ["autodocs", "test"],
  args: { onClick: fn() },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const story: Story = {
  args: {
    children: "你好",
  },
  async play({ canvas, userEvent, args }) {
    await userEvent.click(await canvas.findByText(args.children as string));
    return expect(args.onClick).toHaveBeenCalled();
  },
};
