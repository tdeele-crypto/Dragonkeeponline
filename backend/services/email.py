"""Transactional email sending via Gmail SMTP (App Password).

Used for the password-reset flow. Sending is synchronous (smtplib) and is
invoked from a FastAPI BackgroundTask so it never blocks the request. Missing
configuration or SMTP errors are logged, never raised to the caller, so we
don't leak whether an account exists.
"""
import os
import html
import ssl
import smtplib
import logging
from email.message import EmailMessage
from pathlib import Path

from dotenv import load_dotenv

ROOT_DIR = Path(__file__).parent.parent
load_dotenv(ROOT_DIR / '.env')

logger = logging.getLogger(__name__)

GMAIL_USER = os.environ.get("GMAIL_USER", "").strip()
# Gmail app passwords are shown with spaces; strip them.
GMAIL_APP_PASSWORD = "".join(os.environ.get("GMAIL_APP_PASSWORD", "").split())
RESET_WEB_URL = os.environ.get("RESET_WEB_URL", "").rstrip("/")
RESET_TOKEN_MINUTES = int(os.environ.get("RESET_TOKEN_MINUTES", "30"))


def send_reset_email(to_email: str, raw_token: str) -> None:
    """Send a password-reset link. Failures are logged, not raised."""
    if not GMAIL_USER or not GMAIL_APP_PASSWORD or not RESET_WEB_URL:
        logger.error(
            "Password reset email not configured "
            "(GMAIL_USER / GMAIL_APP_PASSWORD / RESET_WEB_URL missing)"
        )
        return

    link = f"{RESET_WEB_URL}?token={raw_token}"
    safe_link = html.escape(link, quote=True)

    msg = EmailMessage()
    msg["Subject"] = "Nulstil din adgangskode - Dragon Keeper"
    msg["From"] = f"Dragon Keeper <{GMAIL_USER}>"
    msg["To"] = to_email
    msg.set_content(
        "Hej,\n\n"
        "Vi har modtaget en anmodning om at nulstille din adgangskode til Dragon Keeper.\n"
        f"Klik på linket herunder for at vælge en ny adgangskode (gyldigt i {RESET_TOKEN_MINUTES} minutter):\n\n"
        f"{link}\n\n"
        "Hvis du ikke har bedt om dette, kan du blot ignorere denne e-mail.\n\n"
        "Venlig hilsen\nDragon Keeper"
    )
    msg.add_alternative(
        f"""<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1C1917;max-width:520px;margin:0 auto;padding:24px;">
  <h2 style="color:#E07A5F;margin:0 0 8px;">Dragon Keeper</h2>
  <p style="font-size:15px;line-height:1.5;">Hej,</p>
  <p style="font-size:15px;line-height:1.5;">Vi har modtaget en anmodning om at nulstille din adgangskode.
  Klik på knappen herunder for at vælge en ny adgangskode. Linket er gyldigt i {RESET_TOKEN_MINUTES} minutter.</p>
  <p style="margin:24px 0;">
    <a href="{safe_link}" style="background:#E07A5F;color:#ffffff;text-decoration:none;padding:14px 24px;border-radius:10px;font-weight:700;display:inline-block;">Nulstil adgangskode</a>
  </p>
  <p style="font-size:13px;color:#78716C;line-height:1.5;">Virker knappen ikke, så kopiér dette link ind i din browser:<br>
  <a href="{safe_link}" style="color:#E07A5F;word-break:break-all;">{safe_link}</a></p>
  <p style="font-size:13px;color:#78716C;line-height:1.5;">Hvis du ikke har bedt om dette, kan du blot ignorere denne e-mail.</p>
</div>""",
        subtype="html",
    )

    context = ssl.create_default_context()
    try:
        with smtplib.SMTP("smtp.gmail.com", 587, timeout=20) as smtp:
            smtp.ehlo()
            smtp.starttls(context=context)
            smtp.ehlo()
            smtp.login(GMAIL_USER, GMAIL_APP_PASSWORD)
            smtp.send_message(msg)
        logger.info("Password reset email sent to %s", to_email)
    except Exception as e:  # noqa: BLE001 - never break the flow on SMTP errors
        logger.error("Failed to send reset email to %s: %s", to_email, e)
