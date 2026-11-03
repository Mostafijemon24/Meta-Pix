# সহজ ডিজাইন অনুরোধ

_Started 2026-11-03 16:34 UTC_

---

## User

<system-info comment="Only acknowledge these if relevant">
Project title is now "আপনার নতুন নির্দেশনাগুলো অনুযায়ী অ্যাপ্লিকেশনটির UX Architecture-এ কয়েকটি গুরুত্"
The project currently has no files except possibly dotfiles — a `list_files` on the project root would return nothing else.
Current date is now November 3, 2026
</system-info>

<default aesthetic_system_instructions>
The user has not attached a design system. If they have ALSO not attached references or art direction, and the project is empty (the auto-managed _ds/ folder doesn't count), ask your opening questions with the ask_user tool. Whenever you ask opening questions in this project, include a design-system question in the form: the user's pick there sets the visual direction, so do NOT also ask about the visual aesthetic (no questions about vibe, colors or palette directions (including color-swatch svg-options questions), typography, mood, or art direction). Spend your other questions on everything else: audience, purpose, content, structure, scope, interactions, tone of copy. Exception: if the request already states the visual direction as a brand or concrete art direction, leave the design-system question out of your own questions (the app may still add one — it's skippable, and a skip doesn't change the stated direction) — but if they name a design system that isn't attached, keep the question: their pick there is what attaches it.

If the design-system question comes back unanswered — skipped without a pick (a "Not sure" / decide-for-me answer counts as a pick: it applies the effective default) — and no references or other art direction arrived either, THEN ask the visual-aesthetic questions before designing: a follow-up round (or one focused question) about vibe, colors, type, and mood is the right move once the design-system ask went unanswered. Do NOT just pick your own. Once you have a direction, use this guidance when creating designs:
- Choose a type pairing from web-safe set or Google Fonts. Helvetica is a good choice. Avoid hard-to-read or overly stylized fonts. Use 1-3 fonts only.
- Foreground and background: choose a color tone (warm, cool, neutral, something in-between). Use subtly-toned whites and blacks; avoid saturations above 0.02 for whites.
- Accents: choose 0-2 additional accent colors using oklch. All accents should share same chroma and lightness; vary hue.
- NEVER write out an SVG yourself that's more complicated than a square, circle, diamond, etc.
- For imagery, never hand-draw SVGs; use subtly-striped SVG placeholders instead with monospace explainers for what should be dropped there (e.g. “product shot”)

CRITICAL: ignore default aesthetic entirely if given other aesthetic instructions like reference images, design systems or guidance, or if there are user-authored files in the project already (the auto-managed _ds/ folder is not user-authored).
</default aesthetic_system_instructions>

<pasted_text name="Pasted text (813 lines)">
আপনার নতুন নির্দেশনাগুলো অনুযায়ী অ্যাপ্লিকেশনটির UX Architecture-এ কয়েকটি গুরুত্বপূর্ণ পরিবর্তন প্রয়োজন। বিশেষ করে, এটিকে **Mandatory Step-Based Workflow না বানিয়ে Independent Step-Based Image Editor** হিসেবে ডিজাইন করতে হবে।

অর্থাৎ ব্যবহারকারী চাইলে শুধু Metadata যোগ করে Export করবেন, চাইলে শুধু Image Resize করবেন, আবার চাইলে কোনো Metadata ছাড়াই Original Image-এর ফরম্যাট পরিবর্তন করে Export করবেন।

এখানে সবচেয়ে গুরুত্বপূর্ণ UX সিদ্ধান্তগুলো হবে:

1. **No Mandatory Fields:** কোনো Metadata বা সেটিংস পূরণ করা বাধ্যতামূলক নয়।
2. **Independent Export:** প্রতিটি স্টেপ থেকেই ইমেজ Export করা যাবে।
3. **Live Image Preview:** ইমেজ Import করার সঙ্গে সঙ্গেই স্ক্রিনের একদম উপরে Preview দেখা যাবে।
4. **Fixed Bottom Export Bar:** Export Button সবসময় স্ক্রিনের নিচে Fixed থাকবে।
5. **Optional Metadata:** Metadata যুক্ত করা, রাখা অথবা সম্পূর্ণ Remove করা যাবে।
6. **Editable Copyright:** ডিফল্ট Creator/Copyright Name হবে `Mostafij Emon`, তবে পরিবর্তনযোগ্য।
7. **Custom Dimensions:** যেকোনো Width ও Height দিয়ে নিজস্ব Preset তৈরি করা যাবে।

নিচে আপনার আগের Master Prompt-এর সঙ্গে যুক্ত করার জন্য সম্পূর্ণ Updated Instructions দিলাম।

# 2. Updated Master Prompt — MetaPix Studio

এই অংশগুলো শুধু আলাদা করে যুক্ত করার পরিবর্তে আগের Master Prompt-এর সম্পূর্ণ Updated Version হিসেবে ব্যবহার করুন। এতে আপনার নতুন সব Requirement অন্তর্ভুক্ত করা হয়েছে।

# PROJECT: MetaPix Studio
### AI-Powered Social Media Image SEO &amp; Optimization Studio

Act as a Senior Android Product Designer, UX Architect, Mobile Application Specialist, and Premium Design System Expert.

Design a complete, visually stunning, premium Android application named **MetaPix Studio**.

The application transforms AI-generated images into SEO-optimized, social-media-ready images through independent image editing steps, AI-powered metadata generation, platform-specific resizing, format conversion, and flexible export management.

This is not a conventional image resizer.

It is a professional image optimization and export studio.

## 1. Core Product Philosophy

The application must follow these fundamental principles:

- No mandatory metadata fields.
- No mandatory editing steps.
- No forced sequential workflow.
- Every editing step must support independent image export.
- Users can export images at any point.
- Original images must remain untouched.
- Every setting must be optional unless technically required.
- Users must have complete control over metadata and export settings.

### Core Workflow

Import Image → Preview → Edit Any Step → Export

Users must be able to skip any step.

For example:
- Import an image and export immediately.
- Add metadata and export.
- Resize an image and export.
- Change image format and export.
- Remove all metadata and export.
- Combine multiple modifications and export.

Never force users to complete all steps before exporting.

---

# 2. CRITICAL UX ARCHITECTURE

This is the most important design requirement.

Design the image editing workspace as an independent, step-based editor rather than a mandatory wizard.

### Independent Editing Sections

Create three primary editing sections:

**STEP 01 — IMAGE METADATA**
- SEO metadata.
- Copyright information.
- Metadata preservation.
- Metadata removal.

**STEP 02 — IMAGE SIZE**
- Platform presets.
- Orientation selection.
- Custom dimensions.
- Resize and crop.

**STEP 03 — FORMAT &amp; EXPORT**
- PNG.
- JPEG.
- WebP.
- Quality settings.
- Export location.

Each section must be independently accessible.

Users can move between sections freely without losing previous inputs.

### Independent Export Functionality

Every section must have its own accessible Export action.

Examples:

Metadata Section:
A user enters Image Title and Alt Text, then exports immediately.

Image Size Section:
A user selects Pinterest Vertical Pin, then exports immediately.

Format Section:
A user selects WebP and 90% quality, then exports immediately.

No additional information should be required.

### Persistent Export Button

On the main editing workspace, create a fixed bottom export bar.

The export bar must:

- Remain visible while scrolling.
- Stay anchored to the bottom of the screen.
- Never overlap editable content.
- Have a prominent Export Image button.
- Display the current output format.
- Optionally display estimated output size.
- Respect Android system navigation insets.

The export button must be accessible at every editing step.

Use a consistent export experience across all sections.

---

# 3. MAIN EDITING SCREEN — MOST IMPORTANT SCREEN

Design this screen with exceptional attention to UX.

### A. Top Header — Image Preview

Immediately after importing an image, display its preview at the very top of the editing workspace.

This is a mandatory design requirement.

The image preview must appear before the metadata editing fields.

Design the preview area with:

- Large image thumbnail.
- Rounded corners.
- Original image dimensions.
- Original file size.
- Original format.
- Replace Image action.
- Fullscreen Preview action.

The image must be visible immediately after import.

Do not hide the image behind a separate preview screen.

Do not place metadata forms above the image preview.

The image preview must remain visually prominent.

### B. Editing Navigation

Below the image preview, display three clearly separated editing tabs or sections:

1. Metadata
2. Dimensions
3. Format &amp; Export

Use an elegant segmented control or modern tab navigation.

The selected section should have a clear visual indicator.

Switching between sections must not reset user inputs.

### C. Fixed Bottom Export Bar

Keep the Export Image button fixed at the bottom.

Use a premium, full-width button with a subtle gradient.

Example:

[ Export Image → ]

The button must remain accessible regardless of the selected editing section.

---

# 4. IMAGE METADATA MANAGEMENT

Create a dedicated Metadata Editor.

### SEO Metadata Fields

Provide these eight editable fields:

1. Image File Name
2. Image Title
3. Image Alt Text
4. Image Description
5. Primary Focus Keyword
6. Related Keywords
7. Image Caption
8. Relevant Tags

### AI Metadata Generation

Provide:

- Generate All Metadata.
- Regenerate Individual Field.
- Edit Metadata.
- Copy Individual Field.
- Copy All Metadata.
- Clear Individual Field.
- Clear All SEO Metadata.

All fields must be optional.

Do not display mandatory field validation.

Users must be able to export an image even when every metadata field is empty.

### Copyright Information

Create a separate expandable section named:

**Copyright &amp; Ownership**

Include:

Creator / Author:
Default: Mostafij Emon

Copyright Owner:
Default: Mostafij Emon

Copyright Notice:
Default: © Mostafij Emon

Credit Line:
Default: Mostafij Emon

Source:
Optional.

Usage Terms:
Optional.

### Important Default Behavior

The name "Mostafij Emon" must be prefilled in the relevant Creator, Copyright Owner, and Credit fields.

However:

- Users can edit the name.
- Users can replace it with a company name.
- Users can clear the fields.
- Users can disable copyright information.
- Users can save their preferred copyright defaults in Settings.

Never force copyright information into an exported image.

### Metadata Preservation Controls

Create a clearly visible metadata management control.

Provide three options:

**1. Keep Metadata**
Preserve existing supported metadata and include newly entered metadata.

**2. Update Metadata**
Replace or update selected metadata fields while retaining other supported metadata where possible.

**3. Remove All Metadata**
Remove embedded EXIF, IPTC, XMP and other supported metadata from the exported image.

The user must be able to export a completely metadata-free image.

Provide a clear status indicator:

- Metadata Included.
- Metadata Removed.
- No Metadata Added.

Explain that embedded metadata support depends on the output image format.

Never confuse embedded image metadata with the SEO text fields that are displayed in the application.

---

# 5. SOCIAL MEDIA IMAGE SIZE PRESETS

Create a dedicated Social Media Dimensions section.

Every platform must offer horizontal, square, and vertical presets wherever suitable.

Do not provide only one orientation per platform.

### FACEBOOK PRESETS

Horizontal:
1200 × 630 px

Square:
1080 × 1080 px

Vertical:
1080 × 1350 px

### INSTAGRAM PRESETS

Horizontal:
1080 × 566 px

Square:
1080 × 1080 px

Vertical:
1080 × 1350 px

### LINKEDIN PRESETS

Horizontal:
1200 × 627 px

Square:
1080 × 1080 px

Vertical:
1080 × 1350 px

### X (TWITTER) PRESETS

Horizontal:
1600 × 900 px

Square:
1080 × 1080 px

Vertical:
1080 × 1350 px

### PINTEREST PRESETS

Horizontal Pin:
1500 × 1000 px

Square Pin:
1000 × 1000 px

Standard Vertical Pin:
1000 × 1500 px

Long Vertical Pin:
1000 × 2100 px

### CUSTOM SIZE PRESET

Create an additional preset called:

**Custom Size**

Users must be able to enter any custom dimensions.

Provide:

- Custom Width.
- Custom Height.
- Pixel Unit.
- Lock Aspect Ratio.
- Unlock Aspect Ratio.
- Portrait / Landscape / Square indicator.
- Save as Custom Preset.
- Edit Custom Preset.
- Delete Custom Preset.

Allow users to save multiple custom presets.

### Orientation Selector

For every platform, provide visually clear options:

- Horizontal.
- Square.
- Vertical.
- Custom.

Use orientation preview cards with dimension labels.

Make sure the user can easily identify the selected orientation.

IMPORTANT:

All platform dimensions are configurable recommended presets, not hard upload restrictions. Keep preset values editable and make it possible to update them later.

---

# 6. IMAGE RESIZE &amp; OPTIMIZATION

Provide the following controls:

- Fit to Canvas.
- Crop to Fill.
- Maintain Aspect Ratio.
- Lock Aspect Ratio.
- Custom Width.
- Custom Height.
- Image Position.
- Background Fill.
- Original Image Preservation.

Show an image preview before and after resizing.

Never stretch images unintentionally.

If the selected aspect ratio differs from the original image, provide appropriate cropping or background padding options.

---

# 7. IMAGE FORMAT &amp; EXPORT

Provide three primary image format options:

- JPEG / JPG
- PNG
- WebP

### Format Settings

JPEG:
- Quality Slider.
- Compression Settings.
- Background Handling.

PNG:
- Lossless Export.
- Transparency Preservation.

WebP:
- Lossy / Lossless where supported.
- Quality Slider.
- Transparency Preservation.

### Export Information

Display:

- Final Filename.
- Final Dimensions.
- Selected Format.
- Quality Percentage.
- Estimated File Size.
- Metadata Status.

Allow the user to change the filename before exporting.

---

# 8. EXPORT LOCATION MANAGEMENT

Create a premium export destination selector.

Provide:

- Internal Storage.
- Pictures.
- Downloads.
- Custom Folder.
- SD Card, when available.

Use Android Storage Access Framework (SAF).

### Persistent Folder Memory

The application must remember the last successfully selected export location.

Technical UX requirements:

- Save the selected directory URI locally.
- Persist URI permissions using Android SAF.
- Restore the last selected location when the application restarts.
- Provide a Change Location action.
- Gracefully handle deleted, moved, or inaccessible folders.

Do not ask users to select the destination folder every time.

### Export Result

After successful export, display:

- Export Success.
- Image Preview.
- Filename.
- Dimensions.
- File Format.
- File Size.
- Saved Location.

Actions:

- Open Image.
- Share Image.
- Export Another.
- View History.

---

# 9. HOME DASHBOARD

Create a premium dashboard featuring:

- MetaPix Studio branding.
- Create New Project CTA.
- Recent Images.
- Quick Actions.
- Social Platform Shortcuts.
- Export History Shortcut.

Hero Heading:

"Your Images. Perfectly Optimized."

Subtitle:

"Prepare, optimize, and export images for every social platform."

---

# 10. PROJECTS &amp; HISTORY

Create separate Projects and Export History screens.

Projects:
- Saved editing sessions.
- Image thumbnails.
- Metadata status.
- Selected dimensions.
- Edit Project.
- Duplicate Project.
- Delete Project.

History:
- Exported images.
- Filename.
- Format.
- Dimensions.
- File size.
- Export date.
- Saved location.
- Re-export.
- Share.
- Delete History Entry.

---

# 11. SETTINGS

Include:

### General Settings
- Light Mode.
- Dark Mode.
- System Default.
- Language.

### Metadata Defaults
- Default Creator Name.
- Default Copyright Owner.
- Default Copyright Notice.
- Default Credit Line.
- Default Metadata Handling Mode.

Set "Mostafij Emon" as the initial default Creator and Copyright Owner.

All defaults must be editable.

### Export Settings
- Default Image Format.
- Default Quality.
- Default Export Location.
- Remember Last Location.
- Filename Convention.

### AI Settings
- Metadata Generation Language.
- Keyword Generation.
- AI Preferences.

### Storage
- Export History.
- Temporary Files.
- Storage Usage.

---

# 12. DESIGN SYSTEM

Create a sophisticated premium visual identity.

Primary Color: #635BFF

Secondary Color: #8B5CF6

Accent: #22D3EE

Light Background: #F8F9FC

Dark Background: #11121A

Surface: #FFFFFF

Typography:
Manrope / Inter.

Visual Direction:

- Premium creative studio.
- Minimalist.
- Modern.
- Elegant.
- Clean.
- Professional.
- Beautifully balanced.

Use sophisticated gradients sparingly.

Include complete Light and Dark themes.

---

# 13. RESPONSIVE AND ANDROID UX

Design for modern Android smartphones.

Consider:

- Different screen sizes.
- One-handed usability.
- Android navigation bars.
- System insets.
- Keyboard interactions.
- Scrollable content.
- Fixed bottom action bar.
- Touch-friendly controls.

The fixed Export button must never be hidden behind the keyboard or system navigation bar.

---

# 14. REQUIRED VISUAL DELIVERABLES

Generate the complete UI/UX design for:

1. Home Dashboard.
2. Image Import.
3. Main Image Editing Workspace.
4. Metadata Editor.
5. Copyright Settings.
6. Metadata Removal Controls.
7. Social Platform Presets.
8. Horizontal / Square / Vertical Selection.
9. Custom Dimensions.
10. Image Resize &amp; Crop.
11. Format Selection.
12. Export Settings.
13. Export Success.
14. Projects.
15. Export History.
16. General Settings.

The Main Image Editing Workspace is the highest priority.

It must demonstrate:

- Image preview at the very top.
- Three independent editing sections.
- Editable metadata.
- Optional settings.
- Fixed bottom Export button.
- Immediate export without completing other steps.

Show realistic sample content and actual image previews.

Create an interactive prototype with working navigation and representative interactions wherever the design environment supports it.

Do not provide only written explanations or wireframes.

Produce actual visual screens with high-quality UI design.

---

# 15. FINAL PRODUCT EXPERIENCE

MetaPix Studio must feel like a premium professional Android creative application.

The application must not look like:

- A generic AI dashboard.
- A basic image resizer.
- A complicated multi-step form.
- A cluttered photo editing application.

It should feel like a combination of a professional SEO image tool and a modern creative export studio.

The user should always feel in control.

The entire experience must be:

Simple. Flexible. Beautiful. Fast. Professional.

**FINAL DESIGN GOAL:**

Create a production-quality premium Android application UI/UX where users can import any AI-generated image, preview it immediately, optionally add or remove SEO metadata, select any social media image preset or custom dimensions, choose an output format, and export the image at any stage without completing unnecessary steps.

---

# 3. নতুন UI/UX Layout কেমন হওয়া উচিত

আপনার নির্দেশনা অনুযায়ী সবচেয়ে গুরুত্বপূর্ণ স্ক্রিনটির Layout আমি এভাবে নির্ধারণ করব:

### Main Image Editor

```text
┌──────────────────────────────────┐
│  ←  MetaPix Studio          ⋮    │
├──────────────────────────────────┤
│                                  │
│                                  │
│          IMAGE PREVIEW           │
│                                  │
│       [Imported Image Here]       │
│                                  │
│                                  │
│  1200 × 800 px  |  JPG  |  1.2 MB │
│                                  │
│          Replace Image           │
├──────────────────────────────────┤
│                                  │
│  [ Metadata ] [ Size ] [ Format ]│
│                                  │
├──────────────────────────────────┤
│                                  │
│  IMAGE SEO METADATA              │
│                                  │
│  Image File Name                 │
│  [________________________]      │
│                                  │
│  Image Title                     │
│  [________________________]      │
│                                  │
│  Image Alt Text                  │
│  [________________________]      │
│                                  │
│  Image Description               │
│  [________________________]      │
│                                  │
│  Primary Focus Keyword           │
│  [________________________]      │
│                                  │
│  Related Keywords                │
│  [________________________]      │
│                                  │
│  Image Caption                   │
│  [________________________]      │
│                                  │
│  Relevant Tags                   │
│  [________________________]      │
│                                  │
│  COPYRIGHT &amp; OWNERSHIP           │
│  Creator: Mostafij Emon          │
│  Copyright: Mostafij Emon        │
│                                  │
│  Metadata Options                │
│  ● Keep  ○ Update  ○ Remove All  │
│                                  │
├──────────────────────────────────┤
│                                  │
│       [  EXPORT IMAGE  → ]       │
│                                  │
└──────────────────────────────────┘
```

এখানে তিনটি বিষয় বিশেষভাবে গুরুত্বপূর্ণ:

- Image Preview সবসময় Editing Workspace-এর একদম উপরে থাকবে।
- Metadata, Size এবং Format আলাদা Section হবে।
- Export Button নিচে Fixed থাকবে। Section পরিবর্তন করলেও এটি থাকবে।

---

# 4. একটি গুরুত্বপূর্ণ অতিরিক্ত সিদ্ধান্ত

আমি আপনার অ্যাপ্লিকেশনে **Quick Export এবং Advanced Export** নামে দুটি ধারণা রাখার পরামর্শ দেব।

| Quick Export | Advanced Export |
|---|---|
| দ্রুত Export | বিস্তারিত Export Settings |
| বর্তমান সেটিংস ব্যবহার | Format নির্বাচন |
| বর্তমান Dimensions | Quality Control |
| বর্তমান Metadata | Metadata Keep/Remove |
| এক ক্লিকে Export | Custom Export Configuration |

এতে সাধারণ কাজের জন্য ব্যবহারকারীকে বেশি সেটিংসের মধ্যে যেতে হবে না।

**আরেকটি টেকনিক্যাল বিষয়:** Metadata Remove All নির্বাচন করলে শুধু আপনার অ্যাপের তৈরি SEO ফিল্ড নয়, ছবির বিদ্যমান EXIF/IPTC/XMP Metadata-ও যতটুকু ফরম্যাট ও লাইব্রেরি সমর্থন করে মুছে দিতে হবে। অন্যদিকে Metadata Keep করলে বিদ্যমান Metadata অযথা নষ্ট করা যাবে না।

আমার মতে, এই পরিবর্তনগুলোর পর MetaPix Studio-র সবচেয়ে শক্তিশালী বৈশিষ্ট্য হবে এর **Non-Linear Editing + Export Anytime Architecture**। অর্থাৎ ব্যবহারকারীকে কোনো নির্দিষ্ট Workflow অনুসরণ করতে বাধ্য করা হবে না। এটি একটি ভালো Professional Utility App-এর জন্য সঠিক UX সিদ্ধান্ত।
</pasted_text>

<!-- The user explicitly selected the following skills for this project, as attachments to their message. These are not optional context — they define how you work. Use them. -->
<attached-skill name="Design Components">
This project uses Design Components: every design is a single streaming `Name.dc.html` file. The full authoring spec is in your system prompt under "Writing code — Design Components" — follow it. Author and edit `.dc.html` content with the `dc_write`, `dc_html_str_replace`, `dc_js_str_replace`, and `dc_set_props` tools (not `write_file`; `str_replace_edit` works but won't stream); template edits stream into the live preview as you type.
</attached-skill>


<system-reminder>Auto-injected reminder (ignore if not relevant): do not recreate copyrighted or branded UI unless the user's email domain matches that company. Create original designs instead.</system-reminder>

## Assistant

_[tool: read_skill_prompt]_

_[tool: copy_starter_component]_

_[tool: read_file]_

_[tool: str_replace_edit]_

_[tool: dc_write]_

_[tool: dc_write]_

_[tool: ready_for_verification]_

## User

Found issues — fixing…

## Assistant

_[tool: run_script]_

_[tool: ready_for_verification]_

## User

Found issues — fixing…

## Assistant

_[tool: run_script]_

_[tool: ready_for_verification]_

## User

<artifact-content-authored-by-others/>
খুব বেশি জটিল মনে হচ্ছে একটু সহজ ডিজাইন করে দিন।

## User

খুব বেশি জটিল মনে হচ্ছে একটু সহজ ডিজাইন করে দিন।

## Assistant

_[tool: dc_write]_

_[tool: ready_for_verification]_

## User

Your Images. Perfectly Optimized.
Prepare, optimize, and export images for every social platform. লেখা এতো বড়ো রাখার দরকার নাই; MetaPix Studio নাম বাদ দিয়ে Meta Pix নাম রাখুন শুধু।

## Assistant

_[tool: run_script]_

_[tool: ready_for_verification]_

দুটো পরিবর্তন করেছি:
- অ্যাপের নাম এখন শুধু **Meta Pix**।
- Home-এর শিরোনাম ছোট করে 20px আর সাবটাইটেল 13px করা হয়েছে।

বাকি সব আগের মতোই আছে।

## User

Your Images. Perfectly Optimized.
Prepare, optimize, and export images for every social platform. সেন্টার এল্যাইন করে দিন। আর এক্সপোর্ট বটণ দেখছি না।

## Assistant

_[tool: show_html]_

_[tool: multi_screenshot]_

_[tool: run_script]_

_[tool: multi_screenshot]_

_[tool: show_html]_

_[tool: multi_screenshot]_

_[tool: run_script]_

_[tool: ready_for_verification]_

দুটো সমস্যাই ঠিক করেছি:
- **সেন্টার এলাইন:** Home-এর শিরোনাম আর সাবটাইটেল এখন মাঝখানে।
- **এক্সপোর্ট বাটন:** ফোনটা আপনার স্ক্রিনের চেয়ে লম্বা ছিল, তাই Editor-এর নিচের Export বাটন স্ক্রিনের বাইরে পড়ে যাচ্ছিল। এখন ফোনটা স্ক্রিনের উচ্চতা অনুযায়ী নিজে থেকে ছোট-বড় হয়, তাই Export বাটন সবসময় নিচে দেখা যায়।

Export বাটন শুধু Editor-এ থাকে, Home-এ নেই। দেখতে চাইলে বাঁ দিকের তালিকা থেকে "Editor · Metadata" খুলুন।

এছাড়া Editor আর Recent সারিতে যে অপ্রয়োজনীয় আড়াআড়ি স্ক্রলবার দেখা যাচ্ছিল, সেটাও সরিয়ে দিয়েছি।

