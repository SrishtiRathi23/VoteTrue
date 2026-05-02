import asyncio

from app.utils.logger import get_logger

logger = get_logger(__name__)

try:
    from google.api_core.exceptions import GoogleAPIError
    from google.cloud import vision
except ImportError:
    GoogleAPIError = RuntimeError
    vision = None


class MissingVisionClient:
    """Fail-closed placeholder when Cloud Vision SDK is unavailable locally."""

    def text_detection(self, image: object) -> object:
        """
        Raise a clear error when Cloud Vision is unavailable.

        Args:
            image: Image object that would have been sent to Cloud Vision.

        Returns:
            Never returns successfully.

        Raises:
            RuntimeError: Always raised because the SDK is unavailable.
        """
        raise RuntimeError("Google Cloud Vision SDK is not installed")


vision_client = vision.ImageAnnotatorClient() if vision is not None else MissingVisionClient()


class VisionService:
    """Dependency-injected OCR service for uploaded forward screenshots."""

    def __init__(self, client: object = vision_client) -> None:
        """
        Initialize the OCR service.

        Args:
            client: Google Cloud Vision-compatible client.

        Returns:
            None.

        Raises:
            None.
        """
        self.client = client

    async def extract_text_from_image(self, image_bytes: bytes) -> str:
        """
        Extract text from image bytes.

        Args:
            image_bytes: Raw uploaded image bytes.

        Returns:
            Extracted text, or an empty string when OCR fails.

        Raises:
            None.
        """
        return await _extract_text_from_image_impl(image_bytes, self.client)


async def _extract_text_from_image_impl(image_bytes: bytes, client: object) -> str:
    """
    Extracts all text from an image using Google Cloud Vision API.
    Used as the first step in the WhatsApp Forward Verification Engine pipeline.

    Args:
        image_bytes: Raw bytes of the uploaded image file.

    Returns:
        Full text extracted from the image as a single string. Returns empty
        string if no text is detected or the API fails.

    Raises:
        None. SDK and API failures are logged and converted to an empty string.
    """

    def _extract() -> str:
        """
        Execute the synchronous Cloud Vision OCR call.

        Args:
            None.

        Returns:
            Extracted text, or an empty string when no OCR text is available.

        Raises:
            Exception: Propagates unexpected SDK failures to the outer handler.
        """
        if vision is None:
            logger.error("vision_sdk_missing")
            return ""
        image = vision.Image(content=image_bytes)
        response = client.text_detection(image=image)

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
    except (GoogleAPIError, RuntimeError, ValueError, AttributeError) as exc:
        logger.error("vision_call_failed error=%s", str(exc))
        return ""
