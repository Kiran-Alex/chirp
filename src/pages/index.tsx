import Head from "next/head";
import Link from "next/link";
import { SignIn, SignInButton, useUser,SignedIn } from "@clerk/nextjs";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { RouterOutputs, api } from "~/utils/api";
import Image from "next/image";
import LoadingSpinner from "~/components/LoadingSpinner";
import { useState } from "react";
import toast from "react-hot-toast";
import { Layout } from "~/components/Layout";
import { UserButton } from "@clerk/clerk-react";

dayjs.extend(relativeTime);

type PostWithUser = RouterOutputs["post"]["getAll"][number];

const PostView: React.FC<PostWithUser> = ({ post, author }) => {
  return (
    <div className="flex gap-3 border-b border-slate-400 p-4" key={post.id}>
      <Image
        alt="profile pic"
        className="h-14 w-14 rounded-full"
        src={author.profileImageUrl}
        width={56}
        height={56}
      />
      <div className="flex flex-col">
        <div className="flex gap-1 text-slate-300">
          <Link href={`@${author.username}`}>
            <span>{"@" + author.username}</span>
          </Link>
          <span className="text-slate-400">
            <Link href={`/post/${author.id}`}>{` • ${dayjs(post.createdAt).fromNow()}`}</Link>
          </span>
        </div>
        <span className="text-xl"> {post.content}</span>
      </div>
    </div>
  );
};

const CreatePostWizard: React.FC = () => {
  const [input, setInput] = useState("");
  const { user } = useUser();
  const utils = api.useUtils();
  const { mutate, isLoading } = api.post.create.useMutation({
    onSuccess: async () => {
      setInput("");
      await utils.post.getAll.invalidate();
    },
    onError: (e) => {
      const res = e.data?.zodError?.fieldErrors.content;
      if (res) {
        toast.error("Only Emoji's Allowed");
      } else {
        toast.error("Please Try again Later");
      }
    },
  });

  if (!user) {
    return null;
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (input.trim() !== "") {
        mutate({
          content: input.trim(),
        });
      }
    }
  };

  return (
    <div className="flex w-full gap-4">
      <UserButton
      appearance={{
        elements: {
          userButtonAvatarBox: {
            width: 56,
            height: 56
          }
        }
      }} 
       />
      <input
        className="grow bg-transparent outline-none"
        placeholder="Type Emoji's"
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        value={input}
        disabled={isLoading}
      />
      {!isLoading ? (
        <button
          className="text-slate-500"
          disabled={isLoading}
          onClick={() => {
            if (input.trim() !== "") {
              mutate({
                content: input.trim(),
              });
            }
          }}
        >
          Post
        </button>
      ) : (
        <div className="flex flex-col justify-center">
          <LoadingSpinner size={18} />
        </div>
      )}
    </div>
  );
};

const Feed: React.FC = () => {
  const { data, isLoading: postsLoading } = api.post.getAll.useQuery();

  if (postsLoading) {
    return (
      <div className="flex grow items-center justify-center text-center">
        <LoadingSpinner size={56} />
      </div>
    );
  }

  if (!data) {
    return <div>something went wrong </div>;
  }

  return (
    <div className="flex grow flex-col">
      {data.map(({ post, author }) => (
        <PostView post={post} author={author} key={post.id} />
      ))}
    </div>
  );
};

export default function Home() {
  const {isSignedIn} = useUser();

  return (
    <>
      <Head>
        <title></title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Layout>
        <div className="flex border-b p-4">

          
          {!isSignedIn ? (
            <>
            <SignInButton/>
           </>
          ) : (
            <CreatePostWizard />
          )}
        </div>
        <div className="flex grow flex-col overflow-y-scroll">
          <Feed />
        </div>  
      </Layout>
    </>
  );
}

