import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type InfoTooltipProps = {
  content: string;
};

export function InfoTooltip({ content }: InfoTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={content}
          className="inline-flex size-4 items-center justify-center text-gray-400 transition-colors hover:text-gray-600 focus:text-gray-600 focus:outline-none"
        >
          <Info className="size-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent sideOffset={6} className="max-w-56 text-center">
        {content}
      </TooltipContent>
    </Tooltip>
  );
}
