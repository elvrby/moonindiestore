import React from "react";
import Image from "next/image";

const SidebarComponent: React.FC = () =>{
    return(
        <main className="fixed w-">
            <header className='w-full h-screen p-2 text-zinc-500 font-bold hidden lg:block'>
                      <div className='bg-zinc-900 w-full p-5 pt-2 pb-2 pl-2 block justify-between rounded-lg'>
                        <ul className='w-full p-4 pt-2 flex'><li><a className='w-full flex items-center textniconH' href="/">
                        <svg className='w-7 mr-2 fill-zinc-500 textniconH' baseProfile="tiny" version="1.2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12,3c0,0-6.186,5.34-9.643,8.232C2.154,11.416,2,11.684,2,12c0,0.553,0.447,1,1,1h2v7c0,0.553,0.447,1,1,1h3  c0.553,0,1-0.448,1-1v-4h4v4c0,0.552,0.447,1,1,1h3c0.553,0,1-0.447,1-1v-7h2c0.553,0,1-0.447,1-1c0-0.316-0.154-0.584-0.383-0.768  C18.184,8.34,12,3,12,3z"/></svg>
                        Home</a></li></ul>
                        <ul className='w-full p-4 pb-2 flex'><li><a className='w-full flex items-center textniconH' href="">
                        <svg className='w-7 mr-2 fill-zinc-500 textniconH' version="1.1" viewBox="0 0 512 512"  xmlns="http://www.w3.org/2000/svg"><path d="m344.5 298c15-23.6 23.8-51.6 23.8-81.7 0-84.1-68.1-152.3-152.1-152.3-84.1 0-152.2 68.2-152.2 152.3s68.1 152.3 152.1 152.3c30.5 0 58.9-9 82.7-24.4l6.9-4.8 108.6 108.6 33.7-34.3-108.5-108.6 5-7.1zm-43.1-166.8c22.7 22.7 35.2 52.9 35.2 85s-12.5 62.3-35.2 85-52.9 35.2-85 35.2-62.3-12.5-85-35.2-35.2-52.9-35.2-85 12.5-62.3 35.2-85 52.9-35.2 85-35.2 62.3 12.5 85 35.2z"/></svg>
                        Search</a></li></ul>
                      </div>
            
                      <div className='bg-zinc-900 w-full p-5 pt-2 pb-2 pl-2 mt-5 block justify-between rounded-lg'>
                        <div className='pl-2'>
            
                          <div className='w-full pl-2'>
                            <ul><li className='w-full flex items-center textniconH'><svg className='w-7 items-center flex mr-2 fill-zinc-500 textniconH' height="48" viewBox="0 0 48 48" width="48" xmlns="http://www.w3.org/2000/svg"><path d="M0 0h48v48H0z" fill="none"/><path d="M8 12H4v28c0 2.21 1.79 4 4 4h28v-4H8V12zm32-8H16c-2.21 0-4 1.79-4 4v24c0 2.21 1.79 4 4 4h24c2.21 0 4-1.79 4-4V8c0-2.21-1.79-4-4-4zm-2 18H18v-4h20v4zm-8 8H18v-4h12v4zm8-16H18v-4h20v4z"/></svg>Categories</li></ul>
                          </div>
            
                          <div className='mt-2 p-0 text-white'>
                            <div>
                              <ul className='w-full p-2 boxH'><li className='w-full flex items-center'><Image className='rounded-sm' src={"https://res.cloudinary.com/dlv5ytn1a/image/upload/v1742383622/Image/Game/GTA5/hihszbxmnjxyt5wgcjax.jpg"} alt="" width={40} height={40}></Image>
                              <a className='ml-4 text-lg block w-full' href="">Games <span className='text-sm block text-zinc-500 font-semibold'>Top Games</span></a></li></ul>
                            </div>
                            <div>
                              <ul className='w-full p-2 boxH'><li className='w-full flex items-center'><Image className='rounded-sm' src={"https://res.cloudinary.com/dlv5ytn1a/image/upload/v1742394512/Image/App/MSOffice/c1bza8jax6mzshtcsspu.png"} alt="" width={40} height={40}></Image>
                              <a className='ml-4 text-lg block w-full' href="">Applications <span className='text-sm block text-zinc-500 font-semibold'>Top Apps For Your Work</span></a></li></ul>
                            </div>
                          </div>
            
                        </div>
                      </div>
                    </header>
        </main>
    )
}
export default SidebarComponent;