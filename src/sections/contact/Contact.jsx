import "./Contact.css";
import { FiMail, FiGlobe } from "react-icons/fi";
import { FaLinkedin, FaGithub } from "react-icons/fa";
import packageInfo from "../../../package.json";

export default function Contact() {
    const contactLinks = [
        {
            href: "mailto:mrezafathpour@gmail.com",
            icon: FiMail,
            label: "Email",
        },
        {
            href: "https://github.com/mrezafathpour",
            icon: FaGithub,
            label: "GitHub",
        },
        {
            href: "https://www.linkedin.com/in/mohammadreza-fathpour-3885761b3/",
            icon: FaLinkedin,
            label: "LinkedIn",
        },
        {
            href: "https://mrezafathpour.github.io/my-portfolio",
            icon: FiGlobe,
            label: "Website",
        },
    ];

    const isMailLink = (href) => href.startsWith("mailto:");

    return (
        <section className="contact-section" id="Contact">
            <div className="wrapper">
                <div className="contact-icons">
                    {contactLinks.map(({ href, icon: Icon, label }) => (
                        <a
                            key={label}
                            href={href}
                            target={isMailLink(href) ? undefined : "_blank"}
                            rel={isMailLink(href) ? undefined : "noreferrer"}
                            className="contact-icon"
                            aria-label={label}
                        >
                            <Icon />
                        </a>
                    ))}
                </div>

                <footer>
                    <p className="footer-note">
                        Version {packageInfo.version} - Copyright ©{" "}
                        {new Date().getFullYear()} Designed & Developed by <strong>Mohammadreza Fathpour</strong> - All Rights Reserved
                    </p>
                </footer>
            </div>
        </section>
    );
}
