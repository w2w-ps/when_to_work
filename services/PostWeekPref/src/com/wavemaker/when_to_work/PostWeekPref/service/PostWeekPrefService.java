package com.wavemaker.when_to_work.PostWeekPref.service;


import com.wavemaker.when_to_work.PostWeekPref.model.*;
import com.wavemaker.when_to_work.PostWeekPref.model.RootRequest;
import com.wavemaker.when_to_work.PostWeekPref.model.RootResponse;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.lang.Object;
import org.springframework.util.MultiValueMap;
import feign.*;

public interface PostWeekPrefService {

  /**
   * 
   * 
    * @param body RequestBody (optional)
    * @param Authorization Authorization (optional)
   * @return RootResponse
   */
  @RequestLine("POST /preferences/week")
  @Headers({
    "Content-Type: application/json",
    "Accept: */*",
    "Authorization: {Authorization}"  })
  RootResponse invoke(RootRequest body, @Param("Authorization") String Authorization);

}
