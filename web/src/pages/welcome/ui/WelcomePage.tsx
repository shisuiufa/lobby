import { Card } from "@shared/ui";
import { AuthSection } from "./AuthSection";
import { InstantMeetingSection } from "./InstantMeetingSection";

export function WelcomePage() {
  return (
    <Card>
      <div className="w-full h-full flex">
        <AuthSection />
        {/*<InstantMeetingSection />*/}
      </div>
    </Card>
  );
}
