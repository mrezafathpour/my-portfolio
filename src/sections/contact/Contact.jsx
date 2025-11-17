import "./Contact.css";
import { FiMail, FiGlobe } from "react-icons/fi";
import { FaLinkedin, FaGithub } from "react-icons/fa";

export default function Contact() {
    return (
        <section className="contact-section" id="Contact">
            <div className="contact-icons">
                <a
                    href="mailto:mrezafathpour@gmail.com"
                    className="contact-icon"
                    aria-label="Email"
                >
                    <FiMail />
                </a>
                <a
                    href="https://github.com/mrezafathpour"
                    target="_blank"
                    rel="noreferrer"
                    className="contact-icon"
                    aria-label="GitHub"
                >
                    <FaGithub />
                </a>
                <a
                    href="https://www.linkedin.com/in/mohammadreza-fathpour-3885761b3/"
                    target="_blank"
                    rel="noreferrer"
                    className="contact-icon"
                    aria-label="LinkedIn"
                >
                    <FaLinkedin />
                </a>
                <a
                    href="https://mrezafathpour.github.io"
                    target="_blank"
                    rel="noreferrer"
                    className="contact-icon"
                    aria-label="Website"
                >
                    <FiGlobe />
                </a>
            </div>

            <p className="footer-note">
                Designed & Developed by <b>Mohammadreza Fathpour</b>
            </p>
        </section>
    );
}
