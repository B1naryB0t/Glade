// frontend/src/components/CreatePost.jsx
import React, { useState } from "react";
import { api } from "../services/api";
import { PrivacySelector, LocationPrivacyControl } from "./privacy";
import { LocationPicker } from "./location";
import ErrorAlert from "./common/ErrorAlert";

function CreatePost({ onPostCreated }) {
  const [content, setContent] = useState("");
  const [contentWarning, setContentWarning] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [locationPrivacy, setLocationPrivacy] = useState("none");
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [localOnly, setLocalOnly] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [showContentWarning, setShowContentWarning] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!content.trim()) {
      setError("Post content cannot be empty");
      return;
    }

    if (content.length > 5000) {
      setError("Post content must be under 5000 characters");
      return;
    }

    try {
      setIsSubmitting(true);

      // Prepare post data
      const postData = {
        content: content.trim(),
        visibility: visibility,
        local_only: localOnly,
      };

      // Add content warning if provided
      if (showContentWarning && contentWarning.trim()) {
        postData.content_warning = contentWarning.trim();
      }

      // Add location if selected
      if (selectedLocation && locationPrivacy !== "none") {
        postData.location = {
          latitude: selectedLocation.lat,
          longitude: selectedLocation.lon,
          city: locationPrivacy === "city" ? selectedLocation.city : null,
          region:
            locationPrivacy !== "country" ? selectedLocation.region : null,
          country: selectedLocation.country,
        };
      }

      console.log("Creating post:", postData);
      const newPost = await api.createPost(postData);
      console.log("Post created:", newPost);

      // Call callback with new post
      if (onPostCreated) {
        onPostCreated(newPost);
      }

      // Reset form
      setContent("");
      setContentWarning("");
      setVisibility("public");
      setLocationPrivacy("none");
      setSelectedLocation(null);
      setLocalOnly(false);
      setShowContentWarning(false);
      setError(null);
    } catch (err) {
      console.error("Error creating post:", err);
      setError(
        err.response?.data?.error || "Failed to create post. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow border border-[#BBCC42] p-6 mb-6">
      <form onSubmit={handleSubmit}>
        {error && <ErrorAlert error={error} onClose={() => setError(null)} />}

        {/* Content Warning Toggle */}
        <div className="mb-4">
          <button
            type="button"
            onClick={() => setShowContentWarning(!showContentWarning)}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            {showContentWarning ? "Remove" : "Add"} content warning
          </button>
        </div>

        {/* Content Warning Input */}
        {showContentWarning && (
          <div className="mb-4">
            <label
              htmlFor="contentWarning"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Content Warning
            </label>
            <input
              id="contentWarning"
              type="text"
              value={contentWarning}
              onChange={(e) => setContentWarning(e.target.value)}
              placeholder="What should people know before reading?"
              maxLength={200}
              className="w-full border border-[#BBCC42] rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#85993D]"
            />
            <p className="text-xs text-gray-500 mt-1">
              {contentWarning.length}/200 characters
            </p>
          </div>
        )}

        {/* Post Content */}
        <div className="mb-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?"
            rows={4}
            maxLength={5000}
            className="w-full border border-[#BBCC42] rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#85993D] resize-none"
          />
          <p className="text-xs text-gray-500 mt-1 text-right">
            {content.length}/5000 characters
          </p>
        </div>

        {/* Location Picker */}
        <div className="mb-4">
          <LocationPicker
            onLocationSelect={setSelectedLocation}
            initialLocation={selectedLocation}
          />
        </div>

        {/* Location Privacy Control */}
        {selectedLocation && (
          <div className="mb-4">
            <LocationPrivacyControl
              value={locationPrivacy}
              onChange={setLocationPrivacy}
              hasLocation={!!selectedLocation}
            />
          </div>
        )}

        {/* Privacy Selector */}
        <div className="mb-4">
          <PrivacySelector value={visibility} onChange={setVisibility} />
        </div>

        {/* Local Only Toggle */}
        <div className="mb-4 flex items-center">
          <input
            id="localOnly"
            type="checkbox"
            checked={localOnly}
            onChange={(e) => setLocalOnly(e.target.checked)}
            className="h-4 w-4 text-[#85993D] focus:ring-[#85993D] border-[#BBCC42] rounded"
          />
          <label
            htmlFor="localOnly"
            className="ml-2 block text-sm text-gray-700"
          >
            Local only (don't federate to other instances)
          </label>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting || !content.trim()}
            className="bg-[#85993D] text-white px-6 py-2 rounded-md font-medium hover:bg-[#6b7a31] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Posting..." : "Post"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreatePost;
