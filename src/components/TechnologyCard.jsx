import Image from "next/image";

const TechnologyCard = ({ cardInfo }) => {
  const { name, description, imageUrl, bgColor } = cardInfo;

  return (
    <div className="flex flex-1 gap-5 p-2.5 rounded-xl border-1 border-black/20 bg-black/30 hover:bg-black/15 hover:border-(--dark400) transition-colors duration-200">
      <div className={`p-3 ${bgColor} rounded-lg w-fit flex-shrink-0`}>
        <Image
          src={imageUrl}
          width={1000}
          height={1000}
          alt={`${name} logo`}
          className="size-8"
        />
      </div>
      <div className="overflow-clip">
        <h4 className="text-lg font-medium text-stone-200">{name}</h4>
        <p className="text-white/70 text-sm ">
          {description}
        </p>
      </div>
    </div>
  );
};

export default TechnologyCard;