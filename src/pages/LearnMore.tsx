import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BarChart , Users , ClipboardList  } from "lucide-react"
import { Link } from 'react-router-dom';

export default function LearnMore() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6 lg:px-20">
      <div className="max-w-6xl mx-auto space-y-16">
        {/* Header */}
        <section className="text-center space-y-4">
                <h1 className="text-4xl font-bold text-gray-900 text-center">
                    Learn More About <br />
                    <span className="text-primary">Task Management Portal</span>
                </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Task Management Portal is your all-in-one solution to manage tasks, track projects, 
            and collaborate with your team. Whether you’re handling personal tasks 
            or large team projects, Task Management Portal makes it simple and effective.
          </p>
        </section>

        {/* About Section */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-800">Why Choose Task Management Portal?</h2>
          <p className="text-gray-600 leading-relaxed">
            Managing projects and tasks can quickly become overwhelming. Task Management Portal is 
            designed to simplify your workflow by bringing everything into one platform. 
            From creating tasks and assigning deadlines to monitoring progress and 
            collaborating with teammates — Task Management Portal helps you stay in control.  
          </p>
        </section>

        {/* Features Section */}
        <section>
          <h2 className="text-2xl font-bold text-gray-800 mb-8">Key Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="shadow-md rounded-2xl">
              <CardContent className="p-6 space-y-3">
                <h3 className="text-xl font-semibold flex"><ClipboardList className="w-6 h-6 mr-2 text-primary  " /> Task Management</h3>
                <p className="text-gray-600">
                  Create, assign, and organize tasks. Add deadlines and priorities 
                  so you never miss what matters most.
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-md rounded-2xl">
              <CardContent className="p-6 space-y-3">
                <h3 className="text-xl font-semibold flex "><Users className="w-6 h-6 mr-2 text-primary  " /> Team Collaboration</h3>
                <p className="text-gray-600">
                  Work with your team seamlessly. Share updates, assign roles, 
                  and keep communication clear and productive.
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-md rounded-2xl">
              <CardContent className="p-6 space-y-3">
                <h3 className="text-xl font-semibold flex"><BarChart className="w-6 h-6 mr-2 text-primary" /> Progress Tracking</h3>
                <p className="text-gray-600">
                  Visualize project status with dashboards. Quickly see what’s done, 
                  what’s pending, and what needs attention.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-800">Benefits of Using Task Management Portal</h2>
          <ul className="list-disc list-inside text-gray-600 space-y-2">
            <li>Stay organized and never lose track of important tasks.</li>
            <li>Boost productivity with structured workflows.</li>
            <li>Save time with a simple and user-friendly interface.</li>
            <li>Improve teamwork with real-time collaboration tools.</li>
            <li>Track deadlines and milestones effortlessly.</li>
          </ul>
        </section>

        {/* CTA Section */}
        <section className="text-center space-y-6">
          <h2 className="text-2xl font-bold text-gray-800">
            Ready to Take Control of Your Projects?
          </h2>
          <p className="text-gray-600">
            Start today and experience a smarter, faster, and more organized way 
            to manage tasks and projects.
          </p>
            <Link to="/auth">
                <Button size="lg" className="bg-primary hover:bg-primary-700 text-white rounded-2xl px-8 py-3">
                    Get Started Now
                </Button>
            </Link>

        </section>
      </div>
    </div>
  )
}
