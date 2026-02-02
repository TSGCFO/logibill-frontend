"use client";

import { useState } from "react";
import {
  Plus,
  Settings,
  Pencil,
  Trash2,
  Loader2,
  MoreHorizontal,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ServiceConfig {
  id: string;
  service_type: string;
  config_key: string;
  config_value: string;
  description?: string;
  is_active: boolean;
}

const configFormSchema = z.object({
  service_type: z.string().min(1, "Service type is required"),
  config_key: z.string().min(1, "Config key is required"),
  config_value: z.string().min(1, "Config value is required"),
  description: z.string().optional(),
  is_active: z.boolean(),
});

type ConfigFormValues = z.infer<typeof configFormSchema>;

const serviceTypes = [
  "pick",
  "pack",
  "shipping",
  "materials",
  "storage",
  "receiving",
  "returns",
  "other",
];

export default function ServicesConfigPage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<ServiceConfig | null>(null);

  const { data: configsData, isLoading } = useQuery({
    queryKey: ["service-configs"],
    queryFn: async () => {
      const response = await api.get<{ data: ServiceConfig[] }>(
        "/api/v1/services/config"
      );
      return response.data?.data;
    },
  });

  const form = useForm<ConfigFormValues>({
    resolver: zodResolver(configFormSchema),
    defaultValues: {
      service_type: "",
      config_key: "",
      config_value: "",
      description: "",
      is_active: true,
    },
  });

  const createConfig = useMutation({
    mutationFn: async (data: ConfigFormValues) => {
      const response = await api.post("/api/v1/services/config", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-configs"] });
      toast.success("Configuration created");
      setIsDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast.error("Failed to create configuration");
    },
  });

  const updateConfig = useMutation({
    mutationFn: async (data: ConfigFormValues & { id: string }) => {
      const { id, ...payload } = data;
      const response = await api.put(`/api/v1/services/config/${id}`, payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-configs"] });
      toast.success("Configuration updated");
      setIsDialogOpen(false);
      setEditingConfig(null);
      form.reset();
    },
    onError: () => {
      toast.error("Failed to update configuration");
    },
  });

  const deleteConfig = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/v1/services/config/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-configs"] });
      toast.success("Configuration deleted");
    },
    onError: () => {
      toast.error("Failed to delete configuration");
    },
  });

  const onSubmit = (data: ConfigFormValues) => {
    if (editingConfig) {
      updateConfig.mutate({ ...data, id: editingConfig.id });
    } else {
      createConfig.mutate(data);
    }
  };

  const handleEdit = (config: ServiceConfig) => {
    setEditingConfig(config);
    form.reset({
      service_type: config.service_type,
      config_key: config.config_key,
      config_value: config.config_value,
      description: config.description || "",
      is_active: config.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingConfig(null);
    form.reset();
  };

  // Group configs by service type
  const groupedConfigs = configsData?.reduce((acc, config) => {
    if (!acc[config.service_type]) {
      acc[config.service_type] = [];
    }
    acc[config.service_type].push(config);
    return acc;
  }, {} as Record<string, ServiceConfig[]>);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Service Configuration
          </h1>
          <p className="text-muted-foreground">
            Configure service-level settings and parameters
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleCloseDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Configuration
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingConfig ? "Edit" : "Add"} Configuration
              </DialogTitle>
              <DialogDescription>
                Configure service parameters and settings
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="service_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service Type *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select service type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {serviceTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type.charAt(0).toUpperCase() + type.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="config_key"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Config Key *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., min_charge_threshold" {...field} />
                      </FormControl>
                      <FormDescription>
                        Unique identifier for this configuration
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="config_value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Config Value *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 5.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe what this configuration does..."
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel>Active</FormLabel>
                        <FormDescription>
                          Enable this configuration
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCloseDialog}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createConfig.isPending || updateConfig.isPending}
                  >
                    {(createConfig.isPending || updateConfig.isPending) && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {editingConfig ? "Save Changes" : "Add Configuration"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Configs by Service Type */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : groupedConfigs && Object.keys(groupedConfigs).length > 0 ? (
        Object.entries(groupedConfigs).map(([serviceType, configs]) => (
          <Card key={serviceType}>
            <CardHeader>
              <CardTitle className="capitalize">{serviceType} Service</CardTitle>
              <CardDescription>
                {configs.length} configuration{configs.length !== 1 ? "s" : ""}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Config Key</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {configs.map((config) => (
                    <TableRow key={config.id}>
                      <TableCell className="font-mono font-medium">
                        {config.config_key}
                      </TableCell>
                      <TableCell>{config.config_value}</TableCell>
                      <TableCell>
                        {config.description ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="flex items-center gap-1 text-sm text-muted-foreground cursor-help">
                                  <Info className="h-3 w-3" />
                                  {config.description.substring(0, 30)}
                                  {config.description.length > 30 ? "..." : ""}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">{config.description}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={config.is_active ? "default" : "secondary"}
                        >
                          {config.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(config)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => deleteConfig.mutate(config.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Settings className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No configurations</h3>
              <p className="text-muted-foreground mb-4">
                Add service configurations to customize billing behavior
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Configuration
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
