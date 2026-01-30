import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Shield, Users, Droplet, Calendar, X } from "lucide-react";

export default function FAQ() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
            Frequently Asked Questions
          </h1>
          <div className="w-24 h-1 bg-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground text-lg">
            Everything you need to know about our mobile oil change service
          </p>
        </div>

        <Accordion type="single" collapsible className="space-y-4">
          <AccordionItem value="liability" className="border rounded-lg px-4">
            <AccordionTrigger className="text-left font-semibold hover:no-underline">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-primary flex-shrink-0" />
                <span>How does liability work?</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground pt-2 pb-4 pl-8">
              <p>
                The Oil Boys is registered as a Limited Liability Company (LLC). This means that if any damage were to occur to your vehicle during service (which is highly unlikely), the business would be fully liable for any damages. Your vehicle is protected, and we take full responsibility for the work we perform.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="quality" className="border rounded-lg px-4">
            <AccordionTrigger className="text-left font-semibold hover:no-underline">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-primary flex-shrink-0" />
                <span>How can I trust that the service is as good as a traditional mechanic shop?</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground pt-2 pb-4 pl-8">
              <p>
                We hire our technicians directly from applicants who have professional experience working at traditional mechanic shops. In short, we hire the same skilled professionals who would be servicing your vehicle at a brick-and-mortar shop. Our technicians bring the same expertise and quality standards you'd expect from any reputable auto service center.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="oil-type" className="border rounded-lg px-4">
            <AccordionTrigger className="text-left font-semibold hover:no-underline">
              <div className="flex items-center gap-3">
                <Droplet className="w-5 h-5 text-primary flex-shrink-0" />
                <span>What kind of oil do you use?</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground pt-2 pb-4 pl-8">
              <p>
                We use <strong>Full Synthetic oil</strong> on all vehicles, regardless of what type of oil your vehicle has used previously. Switching from conventional to synthetic oil does not damage vehicles—in fact, synthetic oil provides superior protection and performance. Whether your vehicle previously used conventional, synthetic blend, or full synthetic, we'll use full synthetic oil to ensure optimal engine protection.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="process" className="border rounded-lg px-4">
            <AccordionTrigger className="text-left font-semibold hover:no-underline">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-primary flex-shrink-0" />
                <span>How does the process work?</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground pt-2 pb-4 pl-8">
              <ol className="list-decimal list-inside space-y-3">
                <li><strong>Book your appointment:</strong> Fill out our online booking form with your vehicle details and preferred time slot.</li>
                <li><strong>Receive confirmation:</strong> You'll immediately receive an email confirmation of your appointment, and you can cancel up to 2 hours before your appointment if needed.</li>
                <li><strong>Day-of reminder:</strong> On the day of your appointment, you'll receive another reminder email. You can still cancel up to 2 hours before your scheduled time.</li>
                <li><strong>Technician arrives:</strong> Our technician arrives at your location and knocks on your door to collect your vehicle keys.</li>
                <li><strong>Service completed:</strong> The technician completes the oil change at your location, then returns to your door with your keys to let you know your vehicle has been serviced.</li>
                <li><strong>Stay on schedule:</strong> Six months later, you'll receive an email letting you know your oil change is due, making it easy to book your next service.</li>
              </ol>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="cancel" className="border rounded-lg px-4">
            <AccordionTrigger className="text-left font-semibold hover:no-underline">
              <div className="flex items-center gap-3">
                <X className="w-5 h-5 text-primary flex-shrink-0" />
                <span>What if I need to cancel my appointment?</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground pt-2 pb-4 pl-8">
              <p>
                You can cancel your appointment at any time up to 2 hours before your scheduled service time. Simply reply to your confirmation email or contact us at (385) 269-1482. We understand that plans change, and we make it easy to reschedule or cancel your appointment.
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="mt-12 p-6 bg-muted rounded-lg text-center">
          <h3 className="text-xl font-bold mb-2">Still have questions?</h3>
          <p className="text-muted-foreground mb-4">
            We're here to help! Reach out to us anytime.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="tel:3852691482" className="inline-block">
              <button className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors">
                Call or Text: (385) 269-1482
              </button>
            </a>
            <a href="mailto:theoilboysllc@gmail.com" className="inline-block">
              <button className="px-6 py-2 border-2 border-primary text-primary rounded-lg font-semibold hover:bg-primary hover:text-primary-foreground transition-colors">
                Email Us
              </button>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
