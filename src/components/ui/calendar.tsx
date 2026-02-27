"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-4 bg-[#0A0A0B]", className)}
      classNames={{
        months: "flex flex-col",
        month: "space-y-4",
        month_caption: "flex justify-center pt-1 relative items-center mb-4",
        caption_label: "text-sm font-black text-white uppercase tracking-widest",
        nav: "flex items-center",
        button_previous: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 border-white/10 text-white/40 hover:text-white hover:border-primary/50 absolute left-1 z-10"
        ),
        button_next: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 border-white/10 text-white/40 hover:text-white hover:border-primary/50 absolute right-1 z-10"
        ),
        month_grid: "w-full border-collapse space-y-1",
        weekdays: "flex",
        weekday: "text-white/20 w-8 font-black uppercase text-[9px] tracking-widest text-center flex-1",
        weeks: "space-y-1",
        week: "flex w-full",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-8 w-8 p-0 font-bold text-xs hover:bg-white/10 transition-all rounded-full flex items-center justify-center text-white/60 hover:text-white border border-transparent mx-auto"
        ),
        selected: "bg-primary text-white hover:bg-primary hover:text-white focus:bg-primary focus:text-white font-black shadow-[0_0_15px_rgba(255,0,106,0.5)] !opacity-100",
        today: "text-primary font-black relative after:content-[''] after:absolute after:bottom-1 after:w-0.5 after:h-0.5 after:bg-primary after:rounded-full",
        outside: "text-white/5 opacity-20 pointer-events-none",
        disabled: "text-white/5 opacity-30",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) => {
          const Icon = orientation === "left" ? ChevronLeft : ChevronRight;
          return <Icon className="h-4 w-4" />;
        },
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
