import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer, Area, AreaChart } from "recharts";
import { TrendingUp, TrendingDown, Users, Target, Clock, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const Analytics = () => {
  // Enhanced sample data for charts
  const projectData = [
    { name: "Jan", projects: 12, completed: 8, revenue: 45000 },
    { name: "Feb", projects: 15, completed: 12, revenue: 52000 },
    { name: "Mar", projects: 18, completed: 14, revenue: 61000 },
    { name: "Apr", projects: 22, completed: 18, revenue: 68000 },
    { name: "May", projects: 25, completed: 20, revenue: 75000 },
    { name: "Jun", projects: 28, completed: 24, revenue: 82000 },
  ];

  const taskData = [
    { name: "Completed", value: 120, color: "hsl(142 76% 36%)" },
    { name: "In Progress", value: 45, color: "hsl(221 83% 53%)" },
    { name: "To Do", value: 35, color: "hsl(48 96% 53%)" },
    { name: "Blocked", value: 8, color: "hsl(0 84% 60%)" },
  ];

  const teamPerformance = [
    { name: "Week 1", productivity: 85, efficiency: 78, satisfaction: 88 },
    { name: "Week 2", productivity: 90, efficiency: 85, satisfaction: 92 },
    { name: "Week 3", productivity: 78, efficiency: 72, satisfaction: 80 },
    { name: "Week 4", productivity: 92, efficiency: 89, satisfaction: 94 },
  ];

  const revenueData = [
    { month: "Jan", revenue: 45000, target: 50000 },
    { month: "Feb", revenue: 52000, target: 50000 },
    { month: "Mar", revenue: 61000, target: 55000 },
    { month: "Apr", revenue: 68000, target: 60000 },
    { month: "May", revenue: 75000, target: 65000 },
    { month: "Jun", revenue: 82000, target: 70000 },
  ];

  const chartConfig = {
    projects: {
      label: "Projects",
      color: "hsl(221 83% 53%)",
    },
    completed: {
      label: "Completed",
      color: "hsl(142 76% 36%)",
    },
    productivity: {
      label: "Productivity %",
      color: "hsl(262 83% 58%)",
    },
    revenue: {
      label: "Revenue",
      color: "hsl(173 58% 39%)",
    },
    target: {
      label: "Target",
      color: "hsl(48 96% 53%)",
    },
  };

  return (
    <div className="p-6 space-y-8 animate-fade-in">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Analytics Dashboard
        </h1>
        <p className="text-muted-foreground text-lg">
          Track project performance, team productivity, and key business metrics
        </p>
        <div className="flex items-center gap-2 mt-4">
          <Badge variant="secondary" className="animate-pulse">
            <TrendingUp className="w-3 h-3 mr-1" />
            Live Data
          </Badge>
          <Badge variant="outline">Last updated: 2 min ago</Badge>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover-scale border-l-4 border-l-primary bg-gradient-to-br from-background to-muted/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <Target className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">28</div>
            <div className="flex items-center text-xs mt-2">
              <TrendingUp className="w-3 h-3 text-green-500 mr-1" />
              <span className="text-green-500 font-medium">+20%</span>
              <span className="text-muted-foreground ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-scale border-l-4 border-l-green-500 bg-gradient-to-br from-background to-green-50/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Projects</CardTitle>
            <Award className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">24</div>
            <div className="flex items-center text-xs mt-2">
              <TrendingUp className="w-3 h-3 text-green-500 mr-1" />
              <span className="text-green-500 font-medium">+15%</span>
              <span className="text-muted-foreground ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-scale border-l-4 border-l-blue-500 bg-gradient-to-br from-background to-blue-50/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
            <Clock className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">208</div>
            <div className="flex items-center text-xs mt-2">
              <TrendingUp className="w-3 h-3 text-green-500 mr-1" />
              <span className="text-green-500 font-medium">+5%</span>
              <span className="text-muted-foreground ml-1">from last week</span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-scale border-l-4 border-l-purple-500 bg-gradient-to-br from-background to-purple-50/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Productivity</CardTitle>
            <Users className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">92%</div>
            <div className="flex items-center text-xs mt-2">
              <TrendingUp className="w-3 h-3 text-green-500 mr-1" />
              <span className="text-green-500 font-medium">+8%</span>
              <span className="text-muted-foreground ml-1">from last week</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue Trends */}
        <Card className="hover-scale bg-gradient-to-br from-background to-emerald-50/10 border-emerald-200/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
              Revenue vs Target
            </CardTitle>
            <CardDescription>Monthly revenue performance against targets</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[350px]">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="month" />
                <YAxis />
                <ChartTooltip 
                  content={<ChartTooltipContent />} 
                  labelFormatter={(value) => `Month: ${value}`}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="var(--color-revenue)" 
                  fill="url(#revenueGradient)"
                  strokeWidth={3}
                />
                <Line 
                  type="monotone" 
                  dataKey="target" 
                  stroke="var(--color-target)" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Task Distribution */}
        <Card className="hover-scale bg-gradient-to-br from-background to-blue-50/10 border-blue-200/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              Task Distribution
            </CardTitle>
            <CardDescription>Current breakdown of task statuses across all projects</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[350px]">
              <PieChart>
                <Pie
                  data={taskData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {taskData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color}
                      className="hover:opacity-80 transition-opacity cursor-pointer"
                    />
                  ))}
                </Pie>
                <ChartTooltip 
                  content={<ChartTooltipContent />}
                  formatter={(value, name) => [`${value} tasks`, name]}
                />
              </PieChart>
            </ChartContainer>
            <div className="grid grid-cols-2 gap-4 mt-4">
              {taskData.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm font-medium">{item.name}</span>
                  <span className="text-sm text-muted-foreground ml-auto">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Projects Over Time */}
        <Card className="hover-scale bg-gradient-to-br from-background to-purple-50/10 border-purple-200/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-purple-600" />
              Project Progress
            </CardTitle>
            <CardDescription>Monthly project creation and completion trends</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[350px]">
              <BarChart data={projectData} barGap={10}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="name" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar 
                  dataKey="projects" 
                  fill="var(--color-projects)" 
                  radius={[4, 4, 0, 0]}
                  name="Total Projects"
                />
                <Bar 
                  dataKey="completed" 
                  fill="var(--color-completed)" 
                  radius={[4, 4, 0, 0]}
                  name="Completed Projects"
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Team Performance */}
        <Card className="hover-scale bg-gradient-to-br from-background to-indigo-50/10 border-indigo-200/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-600" />
              Team Performance
            </CardTitle>
            <CardDescription>Weekly productivity, efficiency, and satisfaction metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[350px]">
              <LineChart data={teamPerformance}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="name" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line 
                  type="monotone" 
                  dataKey="productivity" 
                  stroke="hsl(262 83% 58%)" 
                  strokeWidth={3}
                  dot={{ fill: "hsl(262 83% 58%)", strokeWidth: 2, r: 5 }}
                  name="Productivity"
                />
                <Line 
                  type="monotone" 
                  dataKey="efficiency" 
                  stroke="hsl(142 76% 36%)" 
                  strokeWidth={3}
                  dot={{ fill: "hsl(142 76% 36%)", strokeWidth: 2, r: 5 }}
                  name="Efficiency"
                />
                <Line 
                  type="monotone" 
                  dataKey="satisfaction" 
                  stroke="hsl(221 83% 53%)" 
                  strokeWidth={3}
                  dot={{ fill: "hsl(221 83% 53%)", strokeWidth: 2, r: 5 }}
                  name="Satisfaction"
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;