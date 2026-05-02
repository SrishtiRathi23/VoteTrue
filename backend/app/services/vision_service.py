import asyncio

from app.utils.logger import get_logger

logger = get_logger(__name__)

try:
    from google.cloud import vision
except ImportError:
    vision = None


class MissingVisionClient:
    """Fail-closed placeholder when Cloud Vision SDK is unavailable locally."""

    def text_detection(self, image: object) -> object:
        raise RuntimeError("Google Cloud Vision SDK is not installed")


vision_client = vision.ImageAnnotatorClient() if vision is not None else MissingVisionClient()


async def extract_text_from_image(image_bytes: bytes) -> str:
    """
    Extracts all text from an image using Google Cloud Vision API.
    Used as the first step in the WhatsApp Forward Verification Engine pipeline.

    Args:
        image_bytes: Raw bytes of the uploaded image file.

    Returns:
        Full text extracted from the image as a single string. Returns empty
        string if no text is detected or the API fails.
    """

    def _extract() -> str:
        if vision is None:
            logger.error("vision_sdk_missing")
            return ""
        image = vision.Image(content=image_bytes)
        response = vision_client.text_detection(image=image)

        if response.error.message:
            logger.error("vision_api_error message=%s", response.error.message)
            return ""

        texts = response.text_annotations
        if not texts:
            logger.info("vision_no_text_detected")
            return ""

        return texts[0].description.strip()

    try:
        extracted = await asyncio.to_thread(_extract)
        logger.info("vision_text_extracted chars=%s", len(extracted))
        return extracted
    except Exception as exc:
        logger.error("vision_call_failed error=%s", str(exc))
        return ""
