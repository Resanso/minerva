import React from "react";
import Head from "next/head";
import {
  Monitor,
  Zap,
  BarChart3,
  Bot,
  ArrowRight,
  MapPin,
  Phone,
  Mail,
  Instagram,
  Linkedin,
} from "lucide-react";
import Lanyard from "@/components/Lanyard";

export default function Page() {
  return (
    <div className="min-h-screen h-screen overflow-y-auto bg-[#0B0F17] text-white font-sans selection:bg-blue-500 selection:text-white overflow-x-hidden">
      {/* --- NAVBAR --- 
          Source: [cite: 1-5, 7]
      */}
      <nav className="fixed top-0 w-full z-50 bg-[#0B0F17]/90 backdrop-blur-md border-b border-white/5">
        <div className="container mx-auto px-6 h-20 flex justify-between items-center">
          {/* Logo - Source [cite: 5] - Menggunakan MINERVA agar konsisten dengan footer [cite: 54] */}
          <a href="/" className="flex items-center">
            <img
              src="/minerva-logo.png"
              alt="MINERVA logo"
              className="h-8 md:h-10 object-contain"
              loading="lazy"
            />
          </a>
          {/* Navigation Links - Source [cite: 1-4] */}
          <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-gray-300">
            <a href="#" className="hover:text-white transition-colors">
              Home
            </a>
            <a href="#product" className="hover:text-white transition-colors">
              Product
            </a>
            <a href="#portfolio" className="hover:text-white transition-colors">
              Portofolio
            </a>
            <a href="#about" className="hover:text-white transition-colors">
              About Us
            </a>
          </div>
          {/* CTA Button - Source [cite: 7] */}
          <a
            href="#contact"
            className="inline-flex items-center justify-center w-10 h-10 rounded-full overflow-hidden shadow-lg shadow-black/30 border border-white/5"
            title="Indonesia"
          >
            <span className="relative w-full h-full block">
              <span className="absolute top-0 left-0 w-full h-1/2 bg-red-600" />
              <span className="absolute bottom-0 left-0 w-full h-1/2 bg-white" />
            </span>
            <span className="sr-only">Indonesia</span>
          </a>
        </div>
      </nav>

      {/* --- HERO SECTION --- 
          Source: [cite: 5-6]
      */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden flex items-center justify-center min-h-screen">
        {/* Background GIF (hero header) */}
        <img
          src="/compro-dashboard.gif"
          alt="Compro dashboard preview"
          className="absolute inset-0 w-full h-full pt-12 object-cover pointer-events-none"
          loading="eager"
        />

        {/* dark overlay to keep text readable */}
        <div className="absolute inset-0 bg-black/45 pointer-events-none" />

        <div className="container mx-auto px-6 text-center relative z-10">
          {/* Subheader - Source [cite: 5] */}
          <h2 className="text-blue-500 font-bold tracking-[0.2em] text-md mb-6 uppercase">
            Digital Twin
          </h2>
          {/* Main Headline - Source [cite: 6] */}
          <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold leading-[1.2] mb-8 max-w-5xl mx-auto bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-gray-400">
            Real-Time Digital Twin AI Optimization for
            <br /> Sustainable Manufacturing
          </h1>
          <div className="flex justify-center mt-10">
            {/* Button text assumed strictly from Source [cite: 45] used in similar context */}
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full text-lg font-semibold transition-transform hover:scale-105 shadow-xl shadow-blue-600/20">
              Try Our Product
            </button>
          </div>
        </div>
      </section>

      {/* --- PRODUCT SECTION --- 
          Source: [cite: 8-16]
      */}
      <section id="product" className="py-24 bg-[#0F141F]">
        <div className="container mx-auto px-6">
          <div className="flex items-center gap-4 mb-16 justify-center">
            {/* Heading - Source [cite: 8] */}
            <h2 className="text-3xl md:text-4xl font-bold text-center uppercase tracking-widest relative">
              Product
              <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-12 h-1 bg-blue-500 rounded-full"></span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
            {/* Card 1 - Source [cite: 9-10] */}
            <div className="group p-8 rounded-3xl bg-[#161C28] border border-white/5 hover:border-blue-500/50 transition-all duration-300">
              <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-500/20 transition-colors">
                <Monitor className="w-7 h-7 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold mb-4">
                Interactive Digital
                <br />
                Twin Dashboard
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Lorem Ipsum is simply dummy text of the printing and typesetting
                industry.
              </p>
            </div>
            {/* Card 2 - Source [cite: 11-12] */}
            <div className="group p-8 rounded-3xl bg-[#161C28] border border-white/5 hover:border-blue-500/50 transition-all duration-300">
              <div className="w-14 h-14 bg-yellow-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-yellow-500/20 transition-colors">
                <Zap className="w-7 h-7 text-yellow-400" />
              </div>
              <h3 className="text-xl font-bold mb-4">
                AI Energy Optimization
                <br />& Simulation
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Lorem Ipsum is simply dummy text of the printing and typesetting
                industry.
              </p>
            </div>
            {/* Card 3 - Source [cite: 13-14] */}
            <div className="group p-8 rounded-3xl bg-[#161C28] border border-white/5 hover:border-blue-500/50 transition-all duration-300">
              <div className="w-14 h-14 bg-green-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-green-500/20 transition-colors">
                <BarChart3 className="w-7 h-7 text-green-400" />
              </div>
              <h3 className="text-xl font-bold mb-4">
                Predictive &<br />
                Prescriptive Analysis
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Lorem Ipsum is simply dummy text of the printing and typesetting
                industry.
              </p>
            </div>

            {/* Card 4 - Source [cite: 15-16] 
                NOTE: "Edey" kept exactly as per source [cite: 15]
            */}
            <div className="group p-8 rounded-3xl bg-[#161C28] border border-white/5 hover:border-blue-500/50 transition-all duration-300">
              <div className="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-purple-500/20 transition-colors">
                <Bot className="w-7 h-7 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold mb-4">
                Ask Al Agent
                <br />
                For Edey Quick Insight
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Lorem Ipsum is simply dummy text of the printing and typesetting
                industry.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- PORTFOLIO SECTION --- 
          Source: [cite: 17-23, 25]
      */}
      <section
        id="portfolio"
        className="py-24 container mx-auto px-6 bg-[#0B0F17]"
      >
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-16">
          {/* Image Placeholder - Matches visuals in [cite: 18] */}
          <div className="w-full lg:w-1/2">
            <div className="relative aspect-video rounded-2xl overflow-hidden border border-gray-700 bg-gray-800 group">
              {/* Visual representation of Hackathon stage */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10"></div>
              <img
                src="/hackathon-winner.JPG"
                alt="Hackathon stage winner"
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute bottom-6 left-6 z-20">
                <span className="bg-blue-600 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Hackathon
                </span>
              </div>
            </div>
          </div>
          {/* Text Content */}
          <div className="w-full lg:w-1/2">
            {/* Source [cite: 17] */}
            <p className="text-blue-500 font-bold tracking-wider uppercase mb-2 text-sm">
              Portofolio
            </p>
            {/* Source [cite: 19] */}
            <h2 className="text-4xl font-bold mb-6 text-white">
              1st Winner Hackathon
            </h2>
            <div className="space-y-4 text-gray-400 leading-relaxed text-sm md:text-base">
              {/* Source [cite: 20] */}
              <p>
                Lorem Ipsum is simply dummy text of the printing and typesetting
                industry.
              </p>
              {/* Source [cite: 21] */}
              <p>
                Lorem ipsum has been the industry's standard dummy text ever
                since the 1500s, when an unknown printer took a galley of type
                and scrambled it to make a type specimen book.
              </p>
              {/* Source [cite: 22] */}
              <p>
                It has survived not only five centuries, but also the leap into
                electronic typesetting, remaining essentially unchanged.
              </p>
              {/* Source [cite: 23] */}
              <p>It was popularised in the 1960s with the release of</p>
            </div>
            {/* Source [cite: 25] */}
            <a
              href="#"
              className="inline-flex items-center gap-2 mt-8 text-blue-400 font-semibold border-b border-blue-400 pb-0.5 hover:text-blue-300 transition-colors"
            >
              See More <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* --- ABOUT US SECTION --- 
          Source: [cite: 24-42]
      */}
      <section id="about" className="py-24 bg-[#0F141F]">
        <div className="container mx-auto px-6">
          {/* Source [cite: 24] */}
          <h2 className="text-4xl font-bold mb-16 text-center">About Us</h2>
          {/* Visi & Misi Grid */}
          <div className="grid md:grid-cols-2 gap-12 lg:gap-20 mb-20">
            {/* Visi Column */}
            <div>
              {/* Source [cite: 26] */}
              <h3 className="text-2xl font-bold text-blue-500 mb-6 uppercase tracking-wider">
                Visi
              </h3>
              <div className="text-gray-400 leading-relaxed space-y-4 text-sm md:text-base text-justify">
                {/* Source [cite: 27] */}
                <p>
                  Lorem Ipsum is simply dummy text of the printing and
                  typesetting industry.
                </p>
                {/* Source [cite: 28] */}
                <p>
                  Lorem Ipsum has been the industry's standard dummy text ever
                  since the 1500s, when an unknown printer took a galley of type
                  and scrambled it to make a type specimen book.
                </p>
                {/* Source [cite: 29] */}
                <p>
                  It has survived not only five centuries, but also the leap
                  into electronic typesetting, remaining essentially unchanged.
                </p>
                {/* Source [cite: 30] */}
                <p>It was popularised in the 1960s with the release of</p>
              </div>
            </div>

            {/* Misi Column */}
            <div>
              {/* Source [cite: 31] */}
              <h3 className="text-2xl font-bold text-blue-500 mb-6 uppercase tracking-wider">
                Misi
              </h3>
              <div className="text-gray-400 leading-relaxed space-y-4 text-sm md:text-base text-justify">
                {/* Source [cite: 32] */}
                <p>
                  Lorem Ipsum is simply dummy text of the printing and
                  typesetting industry.
                </p>
                {/* Source [cite: 33] */}
                <p>
                  Lorem Ipsum has been the industry's standard dummy text ever
                  since the 1500s, when an unknown printer took a galley of type
                  and scrambled it to make a type specimen book, It has sürvived
                  not only five centuries, but also the leap into electronic
                  typesetting, remaining essentially unchanged.
                </p>
                {/* Source [cite: 34] */}
                <p>It was popularised in the 1960s with the release of</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className=" bg-[#0B0F17] w-full h-full">
        {/* Team Lanyards - render 4 lanyards for each team member */}
        <div className=" grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <div>
            <Lanyard
              image="/band.png"
              model="/3d-model/adrian.glb"
              heightClass="h-[85vh] md:h-[90vh]"
            />
          </div>
          <div>
            <Lanyard
              image="/band.png"
              model="/3d-model/dhafin.glb"
              heightClass="h-[85vh] md:h-[90vh]"
            />
          </div>
          <div>
            <Lanyard
              image="/band.png"
              model="/3d-model/resan.glb"
              heightClass="h-[85vh] md:h-[90vh]"
            />
          </div>
          <div>
            <Lanyard
              image="/band.png"
              model="/3d-model/rafi.glb"
              heightClass="h-[85vh] md:h-[90vh]"
            />
          </div>
        </div>
      </section>

      {/* --- BOTTOM CTA --- 
          Source: [cite: 43-45]
      */}
      <section className="py-20 bg-gradient-to-b from-[#0B0F17] to-blue-900/10 text-center border-t border-white/5">
        <div className="container mx-auto px-6">
          <h2 className="text-blue-500 font-bold tracking-[0.2em] text-sm mb-4 uppercase">
            MINERVA
          </h2>
          <h2 className="text-3xl md:text-5xl font-bold mb-8 max-w-3xl mx-auto leading-tight">
            Real-Time Digital Twin AI Optimization for
            <br /> Sustainable Manufacturing
          </h2>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full text-lg font-semibold shadow-lg transition-transform hover:-translate-y-1">
            Try Our Product
          </button>
        </div>
      </section>

      {/* --- FOOTER --- 
          Source: [cite: 46-54] 
      */}
      <footer
        id="contact"
        className="bg-[#05080F] pt-20 pb-10 border-t border-gray-800"
      >
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-20 mb-20">
            {/* Brand Column */}
            <div className="space-y-6">
              {/* Source */}
              <div className="text-2xl font-bold tracking-wider text-white">
                MINERVA
              </div>
              {/* Source [cite: 54] */}
              <p className="text-gray-500 text-sm">
                Develop by MINERVA Team. 2025
              </p>
            </div>
            {/* Event Links Column - Source [cite: 46-49] */}
            <div>
              <h4 className="font-bold text-white mb-6 text-lg">Event Links</h4>
              <ul className="space-y-4 text-gray-400 text-sm">
                <li>
                  <a href="#" className="hover:text-blue-400 transition-colors">
                    Home
                  </a>
                </li>
                <li>
                  <a
                    href="#product"
                    className="hover:text-blue-400 transition-colors"
                  >
                    Product
                  </a>
                </li>
                <li>
                  <a
                    href="#portfolio"
                    className="hover:text-blue-400 transition-colors"
                  >
                    Portofolio
                  </a>
                </li>
                <li>
                  <a
                    href="#about"
                    className="hover:text-blue-400 transition-colors"
                  >
                    About Us
                  </a>
                </li>
              </ul>
            </div>
            {/* Contact Column - Source [cite: 50-53] */}
            <div>
              <h4 className="font-bold text-white mb-6 text-lg">Contact</h4>
              <ul className="space-y-6 text-gray-400 text-sm">
                <li className="flex items-start gap-4">
                  <div className="mt-1">
                    <Phone className="w-5 h-5 text-blue-500" />
                  </div>
                  <span className="leading-relaxed">
                    +62 822-1725-7007 (dhafin)
                  </span>
                </li>
                <li className="flex items-start gap-4">
                  <div className="mt-1">
                    <Mail className="w-5 h-5 text-blue-500" />
                  </div>
                  <span className="leading-relaxed">minerva@gmail.com</span>
                </li>
                <li className="flex items-start gap-4">
                  <div className="mt-1">
                    <MapPin className="w-5 h-5 text-blue-500" />
                  </div>

                  {/* NOTE: "Jawa Bawat" retained strictly as per source [cite: 53] */}
                  <span className="leading-relaxed">
                    Bandung, Jawa Bawat,
                    <br />
                    Indonesia
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Copyright Line */}
          <div className="border-t border-gray-800 pt-8 text-center md:text-left flex flex-col md:flex-row justify-between items-center text-gray-600 text-xs">
            <p>© 2025 MINERVA. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
