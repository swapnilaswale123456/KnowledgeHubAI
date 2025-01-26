import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Star, MoreVertical, FileText } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "~/components/ui/dropdown-menu";
import { getTemplateIcon } from "./templateIcons.tsx";

interface TemplateCardProps {
  template: {
    id: number;
    name: string;
    objective: string;
    style: string;
  };
  onEdit: (id: number) => void;
  onDuplicate: (id: number) => void;
  onDelete: (id: number) => void;
  onView: (id: number) => void;
}

export function TemplateCard({ 
  template,
  onEdit,
  onDuplicate,
  onDelete,
  onView
}: TemplateCardProps) {
  return (
    <Card className="group hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            {getTemplateIcon(template.name)}
            <CardTitle className="text-lg">{template.name}</CardTitle>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(template.id)}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDuplicate(template.id)}>
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-destructive"
                onClick={() => onDelete(template.id)}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <CardDescription className="line-clamp-2">
          {template.objective}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-medium text-sm mb-1">Style</h4>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {template.style}
          </p>
        </div>
        <div className="pt-2 flex justify-between items-center">
          <Button 
            variant="ghost" 
            size="icon"
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Star className="w-4 h-4" />
          </Button>
          <Button 
            variant="outline"
            onClick={() => onView(template.id)}
          >
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 