import React from "react";

export default function SubmitBidModal({ onClose }) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-[#121214] p-6 rounded-2xl border border-white/5 max-w-md w-full">
        <h3>Submit Bid Stub</h3>
        <button onClick={onClose} className="mt-4 px-4 py-2 bg-red-500 text-white rounded">Close</button>
      </div>
    </div>
  );
}
