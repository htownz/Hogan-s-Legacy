import { Helmet } from "react-helmet-async";
import LegislativeUpdates from "../components/legislation/LegislativeUpdates";

export default function LegislativeUpdatesPage() {
  return (
    <>
      <Helmet>
        <title>Legislative Updates | Act Up</title>
      </Helmet>
      <div className="py-4">
        <LegislativeUpdates />
      </div>
    </>
  );
}