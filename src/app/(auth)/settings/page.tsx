"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ProfileTab } from "./profile-tab";
import { RelationshipTab } from "./relationship-tab";

const SettingsPage = () => {
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<"profile" | "relationship">(
    tabFromUrl === "relationship" ? "relationship" : "profile",
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <Link href="/home">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 size-4" />
              Back
            </Button>
          </Link>
        </div>
        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as "profile" | "relationship")}
        >
          <TabsList className="mb-4 w-full sm:mb-6 sm:w-auto">
            <TabsTrigger value="profile" className="text-sm sm:text-base">
              Profile
            </TabsTrigger>
            <TabsTrigger value="relationship" className="text-sm sm:text-base">
              Relationship
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <ProfileTab />
          </TabsContent>

          <TabsContent value="relationship">
            <RelationshipTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SettingsPage;
