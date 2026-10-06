import SlideCanvas from "./SlideCanvas";
import OpenEndedPreview from "./OpenEndedPreview";

/** Live animated preview shown while hovering the Open Ended button. */
export default function OpenEndedPreviewSlide() {
  return (
    <SlideCanvas>
      <div className="oe-question-pill">
        Participants can write a short answer to any question
      </div>
      <div className="slide-body">
        <OpenEndedPreview />
      </div>
    </SlideCanvas>
  );
}

// import { useEffect, useState } from "react";
// import "./OpenEndedPreview.css";

// const RESPONSES = [
//   "Creative thinking is essential for progress.",
//   "No one can make you feel inferior without your consent.",
//   "The only impossible journey is the one you never begin.",
//   "Do or do not. There is no try.",
//   "Be the change that you wish to see in the world.",
//   "What defines us isn't how many times we crash but the number of times we get back up.",
//   "The best time to plant a tree was 20 years ago. The second best time is now.",
//   "Success is not final, failure is not fatal: it is the courage to continue that counts.",
//   "In the middle of difficulty lies opportunity.",
//   "It does not matter how slowly you go as long as you do not stop.",
//   "The only way to do great work is to love what you do.",
//   "Stay hungry, stay foolish.",
//   "Life is what happens when you're busy making other plans.",
//   "The purpose of our lives is to be happy.",
//   "Get busy living or get dying.",
//   "You only live once, but if you do it right, once is enough.",
// ];

// export default function OpenEndedPreview() {
//   // Partition into three columns using modulo 3
//   const column1 = RESPONSES.filter((_, i) => i % 3 === 0);
//   const column2 = RESPONSES.filter((_, i) => i % 3 === 1);
//   const column3 = RESPONSES.filter((_, i) => i % 3 === 2);

//   return (
//     <div className="open-ended-preview">
//       {/* Column 1 */}
//       <div className="oe-column">
//         {column1.map((text, index) => {
//           const originalIndex = index * 3;
//           return (
//             <div
//               key={originalIndex}
//               className="oe-response"
//               style={{ animationDelay: `${originalIndex * 0.4}s` }}
//             >
//               {text}
//             </div>
//           );
//         })}
//       </div>

//       {/* Column 2 */}
//       <div className="oe-column">
//         {column2.map((text, index) => {
//           const originalIndex = index * 3 + 1;
//           return (
//             <div
//               key={originalIndex}
//               className="oe-response"
//               style={{ animationDelay: `${originalIndex * 0.4}s` }}
//             >
//               {text}
//             </div>
//           );
//         })}
//       </div>

//       {/* Column 3 */}
//       <div className="oe-column">
//         {column3.map((text, index) => {
//           const originalIndex = index * 3 + 2;
//           return (
//             <div
//               key={originalIndex}
//               className="oe-response"
//               style={{ animationDelay: `${originalIndex * 0.4}s` }}
//             >
//               {text}
//             </div>
//           );
//         })}
//       </div>
//     </div>
//   );
// }
